const API_KEY = "YGR8Q7256XW12JMYAGMSM2GE32MG29CDKB";
const HEADERS = {
	"user-agent":
		"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36",
	"upgrade-insecure-requests": "1",
	"accept":
		"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
	"accept-encoding": "gzip, deflate, br",
	"accept-language": "en-US,en;q=0.9,en;q=0.8",
};

const api = require("etherscan-api").init(API_KEY);
const decoder = require("abi-decoder");
const puppeteer = require("puppeteer");

const fs = require("fs");

const abiFile = require("./Abis.json");
const transactionFile = require("./Transactions.json");

let contracts = [
    "0xCcc441ac31f02cD96C153DB6fd5Fe0a2F4e6A68d",
    "0x7f268357a8c2552623316e2562d90e642bb538e5",
    "0xbe78fe9a1895fcfe195252c02dc5eb2c89748e72",
    "0xe03f96473c7ad08f4d7c7e26a86b54fd28591a14",
    "0x00000000a50bb64b4bbeceb18715748dface08af",
    "0x8b597a47d72000a752152b112ad57cd84bf7ff53",
    "0x59728544b08ab483533076417fbbb2fd0b17ce3a",
  ];

function waitFor(millis) {
	let start = Date.now(),
		currentDate = null;
	do {
		currentDate = Date.now();
	} while (currentDate - start < millis);
}

async function decode(hash) {
	// body
	let body = (await api.proxy.eth_getTransactionByHash(hash)).result;
	body.input = decoder.decodeMethod(body.input);
	body.blockNumber = parseInt(body.blockNumber.substr(2), 16);
	body.gasPrice = parseInt(body.gasPrice.substr(2), 16) / 1e18;
	body.gas = parseInt(body.gas.substr(2), 16);
	body.nonce = parseInt(body.nonce.substr(2), 16);
	body.transactionIndex = parseInt(body.transactionIndex.substr(2), 16);
	body.value = parseInt(body.value.substr(2), 16) / 1e18;
	body.type = parseInt(body.type.substr(2), 16);
	body.v = parseInt(body.v.substr(2), 16);
	// receipt
	let receipt = (await api.proxy.eth_getTransactionReceipt(hash)).result;
	receipt.logs = decoder.decodeLogs(receipt.logs);
	receipt.blockNumber = parseInt(receipt.blockNumber.substr(2), 16);
	receipt.cumulativeGasUsed = parseInt(
		receipt.cumulativeGasUsed.substr(2),
		16
	);
	receipt.effectiveGasPrice =
		parseInt(receipt.effectiveGasPrice.substr(2), 16) / 1e18;
	receipt.gasUsed = parseInt(receipt.gasUsed.substr(2), 16);
	receipt.transactionIndex = parseInt(receipt.transactionIndex.substr(2), 16);
	receipt.status = parseInt(receipt.status.substr(2), 16);
	receipt.type = parseInt(receipt.type.substr(2), 16);
	return { body: body, receipt: receipt };
}

async function decodeTx(hash) {
	for (let i = 0; i <= 10; i++) {
		tx = await decode(hash);
		if (tx) {
			return tx;
		}
		waitFor(500);
	}
	return undefined;
}

async function downloadTable(page) {
	await page.waitForXPath("//*[@id='maindiv']/div[2]/table/tbody");
	return await page.evaluate(() => {
		rows = Array.from(document.querySelectorAll("tbody > tr"));
		content = rows.map((row) => {
			cols = row.querySelectorAll("td");
			return {
				hash: cols[1].innerText,
				method: cols[2].innerText,
				date: Date.parse(cols[3].innerText),
				from: cols[5].innerText,
				to: cols[7].innerText,
				tokenId: cols[8].innerText,
			};
		});
		return content;
	});
}

async function updateTransactionFile(transaction) {
	if (
		transaction.method != "Proxy Assert" ||
		transaction.method != "0xccc441ac"
	) {
		console.log(transaction.hash);
	}
	transactionFile[transaction.hash] = transaction;

	fs.writeFileSync("Transactions.json", JSON.stringify(transactionFile));
	console.log("> transaction:", transaction);
}

async function initAbis() {
	console.log("Getting contract abis");

	for (let address of contracts) {
		try {
			console.log("> Abi of:", address);
			if (abiFile[address] == null) {
				let abi = JSON.parse(
					(await api.contract.getabi(address)).result
				);
				abiFile[address] = abi;
			}
			decoder.addABI(abiFile[address]);
		} catch (error) {
			console.log(error);
		}
	}
	fs.writeFileSync("Abis.json", JSON.stringify(abiFile));
}

async function main() {
	await initAbis();
	let contract = contracts[0];
	try {
		//Puppeteer Init

		const browser = await puppeteer.launch({ headless: false });
		const page = await browser.newPage();
		await page.setExtraHTTPHeaders(HEADERS);
		await page.goto("https://etherscan.io/token/" + contract);

		//IFrame Jank

		let link =
			"https://etherscan.io" +
			(await page.content())
				.split('<iframe id="tokentxnsiframe" src="')[1]
				.split('1" frameborder="0"')[0]
				.replace(/&amp;/g, "&");
		await page.goto(link + 1);
		let lastPage = await page.evaluate(
			() =>
				document.querySelector(
					"#maindiv > div.d-md-flex.justify-content-between.mb-4 > nav > ul > li:nth-child(3) > span > strong:nth-child(2)"
				).innerText
		);

		console.log("> transaction file:", transactionFile);

		//Main Loop

		for (let i = 1592; i >= 0; i--) {
			console.log("> link:", link + i);
			await page.goto(link + i);
			let data = await downloadTable(page);
			for (let datum of data) {
				if (!transactionFile[datum.hash]) {
					console.log("> decoding:", datum.hash);
					let tx = await decodeTx(datum.hash);
					waitFor(500);
					datum.tx = tx;
					datum.tokenIds = [datum.tokenId];
					delete datum.tokenId;
				} else {
                    console.log("DUPLICATE")
                    let temp = transactionFile[datum.hash]
					temp.tokenIds.push(datum.tokenId);
                    datum = temp;
				}
                updateTransactionFile(datum);
			}
		}
		await browser.close();
	} catch (e) {
		console.log("> error:", e);
	}
}

main();