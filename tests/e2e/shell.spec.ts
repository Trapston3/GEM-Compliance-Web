import './env';
import { test, expect } from '@playwright/test';

// Helper function to log in
async function performLogin(page: any, email: string, pass: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pass);
  await page.click('button[type="submit"]');
  // Wait for redirect to complete
  await page.waitForURL(url => url.pathname === '/' || url.pathname === '/tenders', { timeout: 15000 });
  if (page.url().endsWith('/') || page.url().endsWith(':3000')) {
    await page.goto('/tenders');
  }
}

test.describe('materials tracking system e2e tests', () => {
  test.describe.configure({ mode: 'serial' });
  test.slow();
  
  // Test viewports: Desktop (1280px), Tablet (768px), Mobile (375px)
  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 812 },
  ];

  for (const vp of viewports) {
    test.describe(`viewport: ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        // Clear E2E bidder sent status before each test run to ensure a clean slate
        try {
          const { db, bidders } = require('../../src/db');
          await db.update(bidders).set({
            lastDraftedSentAt: null,
            lastDraftedSentBy: null,
          });
        } catch (err) {
          console.error('Failed to reset bidder status in E2E beforeEach:', err);
        }
      });

      test('renders login screen cleanly and handles dark mode toggle', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByRole('heading', { name: 'Materials Department' })).toBeVisible();
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        
        // Ensure no horizontal scrollbar overflow
        const isOverflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        expect(isOverflowing).toBe(false);
      });

      test('click-path audit: superuser role (6-link flat nav & admin dashboard)', async ({ page }) => {
        // 1. Login as Superuser
        await performLogin(page, 'test_superuser@example.com', 'TestPassword123!');

        // 2. Select first active tender on picker page
        await page.locator('text=Open tender').first().click();
        await expect(page).toHaveURL(/\/tenders\/\d+\/overview/);

        const currentUrl = page.url();
        const tenderBaseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/')); // e.g. "http://localhost:3000/tenders/1"

        // 3. Navigate and verify each of the 6 flat navigation links via DOM attachment and URLs
        
        // --- Page 1: Overview ---
        await expect(page.getByRole('heading', { name: 'Tender Overview' })).toBeAttached();

        // --- Page 2: Bidders ---
        await page.goto(`${tenderBaseUrl}/bidders`);
        await expect(page.getByRole('heading', { name: 'Bidders' })).toBeAttached();
        await expect(page.locator('input[placeholder*="Search bidders"]')).toBeAttached();

        // --- Page 3: Compliance Matrix ---
        await page.goto(`${tenderBaseUrl}/matrix`);
        await expect(page.getByRole('heading', { name: 'Compliance Matrix' })).toBeAttached();
        await expect(page.getByText('Checklist Criteria / क्राइटेरिया')).toBeAttached();

        // --- Page 4: Checklist Setup ---
        await page.goto(`${tenderBaseUrl}/checklist`);
        await expect(page.getByRole('heading', { name: 'Checklist Setup' })).toBeAttached();
        await expect(page.getByText('Configure Compliance Criteria')).toBeAttached();

        // --- Page 5: Emails ---
        await page.goto(`${tenderBaseUrl}/emails`);
        await expect(page.getByRole('heading', { name: 'Bulk Compliance Emails' })).toBeAttached();

        // --- Page 6: Settings ---
        await page.goto(`${tenderBaseUrl}/settings`);
        await expect(page.getByRole('heading', { name: 'Tender Settings' })).toBeAttached();

        // 4. Verify Admin Dashboard access in sidebar
        if (vp.width >= 768) {
          await expect(page.locator('aside')).toContainText('Admin Dashboard');
          // Navigate to admin
          await page.click('text=Admin Dashboard');
          await expect(page).toHaveURL(/\/admin/);
          await expect(page.getByText('User Management')).toBeVisible();
        }
      });

      test('role check: standard user access restrictions', async ({ page }) => {
        // Login as Standard User
        await performLogin(page, 'test_user@example.com', 'TestPassword123!');

        // Select first active tender
        await page.locator('text=Open tender').first().click();
        await expect(page).toHaveURL(/\/tenders\/\d+\/overview/);

        // Verify no Admin Dashboard link in the sidebar
        if (vp.width >= 768) {
          const sidebarText = await page.locator('aside').innerText();
          expect(sidebarText).not.toContain('Admin Dashboard');
        }

        // Verify direct /admin navigation is blocked/redirected
        await page.goto('/admin');
        await expect(page).not.toHaveURL(/\/admin/);
      });

      test('role check: guest user mutation restrictions', async ({ page }) => {
        // Login as Guest
        await performLogin(page, 'test_guest@example.com', 'TestPassword123!');

        // Select first active tender
        await page.locator('text=Open tender').first().click();
        await expect(page).toHaveURL(/\/tenders\/\d+\/overview/);

        const currentUrl = page.url();
        const tenderBaseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));

        // Navigate to Checklist Setup page
        await page.goto(`${tenderBaseUrl}/checklist`);
        await expect(page.getByRole('heading', { name: 'Checklist Setup' })).toBeAttached();

        // Confirm guest users cannot delete criteria items (delete buttons should be absent)
        const deleteButtonsCount = await page.locator('button[title="Delete Item"]').count();
        expect(deleteButtonsCount).toBe(0);

        // Navigate to Tender Settings page
        await page.goto(`${tenderBaseUrl}/settings`);
        await expect(page.getByRole('heading', { name: 'Tender Settings' })).toBeAttached();

        // Confirm guest users cannot delete tender (Delete button should be disabled or message shown)
        const deleteMessage = page.getByText('Guests cannot permanently delete tenders').first();
        await expect(deleteMessage).toBeAttached();
      });

      test('emails: copy text logs drafted/sent status and triggers confirmation on resend', async ({ page }) => {
        // 1. Login as Superuser
        await performLogin(page, 'test_superuser@example.com', 'TestPassword123!');

        // 2. Select first active tender
        await page.locator('text=Open tender').first().click();
        await expect(page).toHaveURL(/\/tenders\/\d+\/overview/);

        const currentUrl = page.url();
        const tenderBaseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));

        // 3. Go to Emails page
        await page.goto(`${tenderBaseUrl}/emails`);
        await expect(page.getByRole('heading', { name: 'Bulk Compliance Emails' })).toBeAttached();

        // 4. Click "Copy Text" on the active bidder draft
        await page.click('text=Copy Text');
        await expect(page.locator('text=Email body copied').first()).toBeVisible({ timeout: 15000 });

        // 5. Verify the Left Panel now shows "Last drafted/sent: ... by Test Superuser"
        await expect(page.locator('text=Last drafted/sent:').first()).toBeAttached({ timeout: 15000 });

        // 6. Verify the warning text "Already drafted/sent today" is visible
        await expect(page.locator('text=Already drafted/sent today').first()).toBeVisible({ timeout: 15000 });

        // 7. Click "Copy Text" again and check it shows the error warning toast
        await page.click('text=Copy Text');
        await expect(page.locator('text=Please confirm re-send')).toBeVisible({ timeout: 15000 });

        // 8. Check the checkbox "Confirm Re-send"
        await page.locator('input[type="checkbox"]').check();
        
        // 9. Click "Copy Text" again and verify it succeeds
        await page.click('text=Copy Text');
        await expect(page.locator('text=Email body copied').first()).toBeVisible({ timeout: 15000 });
      });
    });
  }
});
