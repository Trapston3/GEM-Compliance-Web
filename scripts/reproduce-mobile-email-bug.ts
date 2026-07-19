import { chromium, devices } from 'playwright';

async function run() {
  console.log('Launching Chromium Mobile context...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['Pixel 5'], // Mobile Android viewport
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3001/login...');
  await page.goto('http://localhost:3001/login');
  await page.fill('input[type="email"]', 'shailendra.tiwari@mrpl.co.in');
  await page.fill('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(2000);
  await page.goto('http://localhost:3001/tenders/1/emails');
  await page.waitForTimeout(1500);

  // Take screenshot of mobile email drafting before fix
  await page.screenshot({ path: 'mobile_email_before.png', fullPage: true });
  console.log('Saved mobile_email_before.png');

  await browser.close();
}

run().catch(console.error);
