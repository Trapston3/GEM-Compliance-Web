import { chromium, devices } from 'playwright';

async function capture() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['Pixel 5'],
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3001/login...');
  await page.goto('http://localhost:3001/login');
  await page.fill('input[type="email"]', 'shailendra.tiwari@mrpl.co.in');
  await page.fill('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(2000);
  await page.goto('http://localhost:3001/tenders/1/overview');
  await page.waitForTimeout(1000);

  // Take screenshot of mobile overview AFTER changes (Option C sub-header pill bar + 1 hamburger + Search icon)
  await page.screenshot({ path: 'after_mobile_overview.png' });
  console.log('Saved after_mobile_overview.png');

  // Open left sidebar to show 0 bottom bar
  const leftMenuBtn = page.locator('button[aria-label="Open navigation"]');
  if (await leftMenuBtn.isVisible()) {
    await leftMenuBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'after_mobile_sidebar.png' });
    console.log('Saved after_mobile_sidebar.png');
  }

  await browser.close();
}

capture().catch(console.error);
