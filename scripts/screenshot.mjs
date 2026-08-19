import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: 'new',
  });
  const page = await browser.newPage();
  
  // Set viewport to desktop
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'screenshot_desktop.png' });
  
  // Set viewport to mobile
  await page.setViewport({ width: 375, height: 667 });
  await page.screenshot({ path: 'screenshot_mobile.png' });

  // Let's test the chat submission
  // Find the input and type something
  await page.type('textarea', 'Hello, this is a test!');
  await page.click('button[type="submit"]'); // assuming there is a submit button

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_mobile_chat.png' });

  await browser.close();
  console.log("Screenshots taken.");
})();
