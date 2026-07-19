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

  // Navigate to Admin Dashboard
  await page.goto(`http://localhost:${targetPort}/admin`);
  await page.waitForTimeout(800);

  // Switch to Checklist Templates tab
  const templatesTab = page.locator('button:has-text("Checklist Templates")').first();
  await templatesTab.click();
  await page.waitForTimeout(500);

  // Click New Template button
  const newTemplateBtn = page.locator('button:has-text("New Template")').first();
  await newTemplateBtn.click();
  await page.waitForTimeout(600);

  const screenshot3Path = 'C:\\Users\\traps\\.gemini\\antigravity\\brain\\4be83aab-bd0b-465f-981e-9d0c1ef44d19\\screenshot_admin_template_form.png';
  await page.screenshot({ path: screenshot3Path, fullPage: false });
  console.log('Screenshot 3 (Admin Template Modal) saved to:', screenshot3Path);

  await browser.close();
  process.exit(0);
}

capture().catch((err) => {
  console.error('Error capturing screenshot:', err);
  process.exit(1);
});
