import { chromium } from '@playwright/test';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  let targetPort = 3001;

  console.log(`Navigating to http://localhost:${targetPort}/login...`);
  await page.goto(`http://localhost:${targetPort}/login`);
  await page.fill('input[type="email"]', 'test_superuser@example.com');
  await page.fill('input[type="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/tenders**', { timeout: 10000 });
  console.log('Logged in successfully!');

  // 1. Capture Screenshot 1: New Tender Modal Segmented Slider
  const newTenderBtn = page.locator('button:has-text("New Tender"), button:has-text("Create Tender")').first();
  await newTenderBtn.click();
  await page.waitForTimeout(600);

  const screenshot1Path = 'C:\\Users\\traps\\.gemini\\antigravity\\brain\\4be83aab-bd0b-465f-981e-9d0c1ef44d19\\screenshot_new_tender_slider.png';
  await page.screenshot({ path: screenshot1Path, fullPage: false });
  console.log('Screenshot 1 (New Tender Segmented Slider) saved to:', screenshot1Path);

  // Close modal
  const cancelBtn = page.locator('button:has-text("Cancel")').first();
  if (await cancelBtn.isVisible()) {
    await cancelBtn.click();
    await page.waitForTimeout(400);
  }

  // 2. Capture Screenshot 2: Compliance Matrix 3-Way Segmented Pill Buttons
  const openTenderBtn = page.locator('a[href*="/tenders/"]').first();
  const href = await openTenderBtn.getAttribute('href');

  if (href) {
    const tenderId = href.split('/')[2];
    console.log(`Navigating to http://localhost:${targetPort}/tenders/${tenderId}/matrix...`);
    await page.goto(`http://localhost:${targetPort}/tenders/${tenderId}/matrix`);
    await page.waitForTimeout(1000);

    const screenshot2Path = 'C:\\Users\\traps\\.gemini\\antigravity\\brain\\4be83aab-bd0b-465f-981e-9d0c1ef44d19\\screenshot_compliance_matrix_pills.png';
    await page.screenshot({ path: screenshot2Path, fullPage: false });
    console.log('Screenshot 2 (Compliance Matrix Segmented Pills) saved to:', screenshot2Path);
  }

  await browser.close();
  process.exit(0);
}

capture().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
