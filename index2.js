const puppeteer = require("puppeteer");
(async () => {
	try {
		const contract = "0xCcc441ac31f02cD96C153DB6fd5Fe0a2F4e6A68d";
		const browser = await puppeteer.launch({ devtools: true });
		const page = await browser.newPage();
		await page.setExtraHTTPHeaders({
			"user-agent":
				"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36",
			"upgrade-insecure-requests": "1",
			"accept":
				"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
			"accept-encoding": "gzip, deflate, br",
			"accept-language": "en-US,en;q=0.9,en;q=0.8",
		});
		await page.goto("https://etherscan.io/token/" + contract);
		let link =
			"https://etherscan.io" +
			(await page.content())
				.split('<iframe id="tokentxnsiframe" src="')[1]
				.split('1" frameborder="0"')[0]
				.replace(/&amp;/g, "&");
		console.log("> link:", link);
        for ( let i = 1; i<= 4000; i++){
            
        }
		await page.goto(link + 1);

		await page.waitForXPath("//*[@id='maindiv']/div[2]/table/tbody");
		data = await page.evaluate(() => {
			debugger;
			rows = Array.from(document.querySelectorAll("tbody > tr"));
			content = rows.map((row) => {
				cols = row.querySelectorAll("td");
				return {
					hash: cols[1].innerText,
					method: cols[2].innerText,
					date: Date.parse(cols[3].innerText),
					from: cols[5].innerText,
					to: cols[7].innerText,
					tokenid: cols[8].innerText,
				};
			});
			return content;
		});
		console.log(data);

		await browser.close();
	} catch (e) {
		console.log("> error:", e);
	}
})();