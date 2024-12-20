const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 自动化污点分析主函数
(async () => {
	const browser = await puppeteer.launch({headless: true});
	const page = await browser.newPage();

	const injectTaintScript = `
        (function() {
            window.taintLogs = []; // 存储污点分析日志

            const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').set;
            Object.defineProperty(Element.prototype, 'innerHTML', {
                set: function(value) {
                    window.taintLogs.push({ type: 'HTML Injection', content: value });
                    return originalInnerHTML.call(this, value);
                }
            });

            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                window.taintLogs.push({ type: 'API Call', url: args[0] });
                return originalFetch.apply(this, args);
            };
        })();
    `;

	const targetURL = 'http://127.0.0.1:3001/test_taint_web.html';
	await page.goto(targetURL, {waitUntil: 'networkidle2'});
	await page.evaluate(injectTaintScript);

	console.log('[Automation] Simulating user inputs...');
	await page.type('#userInput', "<script>alert('XSS')</script>");
	await page.click('button');

	console.log('[Automation] Triggering API request...');
	await page.click('button:nth-of-type(2)');
	await new Promise(resolve => setTimeout(resolve, 3000));

	const logs = await page.evaluate(() => window.taintLogs);

	const reportFilePath = path.join(__dirname, 'taint_analysis_report.json');
	fs.writeFileSync(reportFilePath, JSON.stringify(logs, null, 2), 'utf-8');
	console.log(`[Taint Analysis] Report saved to ${reportFilePath}`);

	await browser.close();
})();
