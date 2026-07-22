import { chromium, devices } from 'playwright';

async function verify() {
  const browser = await chromium.launch();

  // 1. Desktop Context - Login with dedicated test user
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('Logging in as test_user@example.com...');
  await page.goto('http://localhost:3001/login');
  await page.fill('input[type="email"]', 'test_user@example.com');
  await page.fill('input[type="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');

  // Wait for redirect away from /login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  console.log('Successfully logged in! Current URL:', page.url());

  // Save login success screenshot
  await page.screenshot({ path: 'login_success_verification.png' });
  console.log('Saved login_success_verification.png');

  // Navigate to /tenders to list test user tenders
  await page.goto('http://localhost:3001/tenders');
  await page.waitForTimeout(1500);

  const tenderLinks = await page.locator('a[href*="/tenders/"]').all();
  console.log(`Found ${tenderLinks.length} tender links for test_user@example.com`);
  
  if (tenderLinks.length > 0) {
    const href = await tenderLinks[0].getAttribute('href');
    const tenderId = href?.split('/')[2];
    console.log(`Navigating to test email workspace at /tenders/${tenderId}/emails...`);
    await page.goto(`http://localhost:3001/tenders/${tenderId}/emails`);
    await page.waitForTimeout(1500);

    // Save desktop email draft screenshot
    await page.screenshot({ path: 'spec_email_draft_desktop.png', fullPage: true });
    console.log('Saved spec_email_draft_desktop.png');

    // Click Bulk Export button
    const bulkExportBtn = page.getByRole('button', { name: /Bulk Export/i });
    if (await bulkExportBtn.isVisible()) {
      await bulkExportBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'spec_bulk_export_modal.png' });
      console.log('Saved spec_bulk_export_modal.png');
    }
  }

  // 2. Mobile Context - Mobile screenshot of email workspace
  const contextMobile = await browser.newContext({
    ...devices['Pixel 5'],
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto('http://localhost:3001/login');
  await pageMobile.fill('input[type="email"]', 'test_user@example.com');
  await pageMobile.fill('input[type="password"]', 'TestPassword123!');
  await pageMobile.click('button[type="submit"]');
  await pageMobile.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

  const mobileTenderLinks = await pageMobile.locator('a[href*="/tenders/"]').all();
  if (mobileTenderLinks.length > 0) {
    const href = await mobileTenderLinks[0].getAttribute('href');
    const tenderId = href?.split('/')[2];
    await pageMobile.goto(`http://localhost:3001/tenders/${tenderId}/emails`);
    await pageMobile.waitForTimeout(1500);
    await pageMobile.screenshot({ path: 'spec_email_draft_mobile.png', fullPage: true });
    console.log('Saved spec_email_draft_mobile.png');
  }

  await browser.close();
}

verify().catch(console.error);
