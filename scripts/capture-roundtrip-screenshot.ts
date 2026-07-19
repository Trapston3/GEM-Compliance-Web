import { chromium } from '@playwright/test';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

async function capture() {
  // 1. Create a sample exported Excel file with Bidder Contact Block
  const wsData = [
    ["Bidder Name / बोलीदाता का नाम", "Contact Field", "L&T Engineering Ltd", "BHEL Heavy Electricals", "Tata Projects Pvt Ltd"],
    ["Email Address / ईमेल", "Contact Field", "tenders@lt-engineering.com", "compliance@bhel.co.in", "bids@tataprojects.com"],
    ["Contact Person / संपर्क व्यक्ति", "Contact Field", "Rajesh Kumar", "Anil Sharma", "Priya Verma"],
    ["Phone Number / फोन नंबर", "Contact Field", "9876543210", "9812345678", "9988776655"],
    [],
    ["Checklist Item / क्राइटेरिया", "Category / श्रेणी", "L&T Engineering Ltd", "BHEL Heavy Electricals", "Tata Projects Pvt Ltd"],
    ["DECLARATION ON BANNING or HOLIDAY LISTING", "Submission / प्रलेख", "Submitted", "Pending", "Submitted"],
    ["NIL DEVIATION", "Submission / प्रलेख", "Submitted", "Submitted", "Pending"],
    ["EMD GUARANTEE", "Submission / प्रलेख", "Submitted", "Pending", "Submitted"],
    ["PRICE REDUCTION SCHEDULE (PRS)", "Acceptance / नियम", "Accepted", "Accepted", "Not Accepted"],
  ];

  const tempFilePath = path.join(process.cwd(), 'scratch', 'test_exported_matrix.xlsx');
  if (!fs.existsSync(path.join(process.cwd(), 'scratch'))) {
    fs.mkdirSync(path.join(process.cwd(), 'scratch'), { recursive: true });
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Compliance Matrix");
  XLSX.writeFile(wb, tempFilePath);
  console.log('Sample Excel file written to:', tempFilePath);

  // 2. Launch Chromium
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

  // Navigate directly to bidders page of first tender
  const openTenderBtn = page.locator('a[href*="/tenders/"]').first();
  const href = await openTenderBtn.getAttribute('href');
  console.log('Tender link href:', href);

  if (href) {
    const tenderId = href.split('/')[2];
    console.log(`Navigating to http://localhost:${targetPort}/tenders/${tenderId}/bidders...`);
    await page.goto(`http://localhost:${targetPort}/tenders/${tenderId}/bidders`);
    await page.waitForTimeout(1000);
  }

  // Click Import Bidders button
  const importBtn = page.locator('button:has-text("Import Bidders"), button:has-text("Import")').first();
  await importBtn.click();
  await page.waitForTimeout(500);

  // Upload the file
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(tempFilePath);
  await page.waitForTimeout(1500);

  // Capture screenshot of the modal with auto-detection badges
  const screenshotPath = 'C:\\Users\\traps\\.gemini\\antigravity\\brain\\4be83aab-bd0b-465f-981e-9d0c1ef44d19\\screenshot_roundtrip_import.png';
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Screenshot saved to:', screenshotPath);

  await browser.close();
  process.exit(0);
}

capture().catch((err) => {
  console.error('Error capturing screenshot:', err);
  process.exit(1);
});
