let apikey = "YGR8Q7256XW12JMYAGMSM2GE32MG29CDKB"

const api = require('etherscan-api').init(apikey)
const decoder = require('abi-decoder')
const puppeteer = require('puppeteer')

let tx = "0x5bbddeca6474a2bb4ea97bc5372b1f19032e84f7bb933e87681b9322efcae2a3"

let contracts = [
    "0x5cc5b05a8a13e3fbdb0bb9fccd98d38e50f90c38",
    "0xCcc441ac31f02cD96C153DB6fd5Fe0a2F4e6A68d"
]

async function run1 (){
    for (let address of contracts){
        let abi = JSON.parse((await api.contract.getabi(address)).result)
        decoder.addABI(abi)
        //console.log(abi)
    }
    let body = (await api.proxy.eth_getTransactionByHash(tx)).result
    console.log("> body:",body)
    body.input = decoder.decodeMethod(body.input)
    console.log("> body.input:",body.input)
    let receipt = (await api.proxy.eth_getTransactionReceipt(tx)).result
    receipt.logs = decoder.decodeLogs(receipt.logs)
    console.log("> receipt.logs:",receipt.logs)
}


async function initAbis(){
    for (let address of contracts) {
		let abi = JSON.parse((await api.contract.getabi(address)).result);
		decoder.addABI(abi);
		//console.log(abi);
	}
}

async function decode(tx){
    // body
	let body = (await api.proxy.eth_getTransactionByHash(tx)).result;
	body.input = decoder.decodeMethod(body.input);
	body.blockNumber = parseInt(body.blockNumber.substr(2), 16);
	body.gasPrice = parseInt(body.gasPrice.substr(2), 16) / 1e18;
    body.gas = parseInt(body.gas.substr(2), 16);
    body.nonce = parseInt(body.nonce.substr(2), 16);
    body.transactionIndex = parseInt(body.transactionIndex.substr(2), 16);
    body.value = parseInt(body.value.substr(2), 16) / 1e18;
    body.type = parseInt(body.type.substr(2), 16);
    body.v = parseInt(body.v.substr(2), 16);
	console.log("> body:", body);
	// receipt
	let receipt = (await api.proxy.eth_getTransactionReceipt(tx)).result;
	receipt.logs = decoder.decodeLogs(receipt.logs);
	receipt.blockNumber = parseInt(receipt.blockNumber.substr(2), 16);
    receipt.cumulativeGasUsed = parseInt(receipt.cumulativeGasUsed.substr(2), 16);
    receipt.effectiveGasPrice = parseInt(receipt.effectiveGasPrice.substr(2), 16) / 1e18;
    receipt.gasUsed = parseInt(receipt.gasUsed.substr(2), 16);
    receipt.transactionIndex = parseInt(receipt.transactionIndex.substr(2), 16);
    receipt.status = parseInt(receipt.status.substr(2), 16);
    receipt.type = parseInt(receipt.type.substr(2), 16);
	console.log("> receipt:", receipt);
    return { body:body, receipt:receipt}
}

async function run() {
	try {
        let contract = contracts[0]
        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        //extra config to be able to get in
        await page.setExtraHTTPHeaders({
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36',
            'upgrade-insecure-requests': '1',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'en-US,en;q=0.9,en;q=0.8'
        });
        await page.goto('https://etherscan.io/token/' + contract);

        ///link does not work
        let link = ((await page.content()).split('<iframe id="tokentxnsiframe" src="')[1]).split('1" frameborder="0"')[0].replace(/&amp/g, "&")
        await browser.close()
        console.log(">Link:",link)
    } catch (error) {
        console.log(">error:",error)
    }
}
run();