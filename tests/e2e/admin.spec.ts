import './env';
import { test, expect } from '@playwright/test';

async function performLogin(page: any, email: string, pass: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pass);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => url.pathname === '/' || url.pathname === '/tenders', { timeout: 15000 });
}

test.describe('Admin Dashboard new features E2E tests', () => {
  test.describe.configure({ mode: 'serial' });
  test.slow();

  test('superuser can view templates and add user button in admin dashboard', async ({ page }) => {
    // 1. Login as Superuser
    await performLogin(page, 'test_superuser@example.com', 'TestPassword123!');

    // 2. Navigate to Admin Dashboard
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);

    // 3. Verify Add User button is present
    await expect(page.locator('text=Add User').first()).toBeVisible();

    // 4. Click Checklist Templates tab
    await page.click('text=Checklist Templates');

    // 5. Verify Add Template button is present
    await expect(page.locator('text=Add Template').first()).toBeVisible();
  });
});
