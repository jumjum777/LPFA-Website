const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const htmlPath = path.join(__dirname, 'board-report.html');
  const outputPath = path.join(__dirname, '..', 'LPFA-Platform-Report.pdf');
  const html = fs.readFileSync(htmlPath, 'utf-8');

  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: outputPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.6in', bottom: '0.8in', left: '0.7in', right: '0.7in' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width:100%;font-size:8px;color:#94A3B8;padding:0 0.7in;display:flex;justify-content:space-between;font-family:sans-serif;">
        <span>LPFA Digital Platform Report — Confidential</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
  });

  await browser.close();
  console.log('PDF generated:', outputPath);
})();
