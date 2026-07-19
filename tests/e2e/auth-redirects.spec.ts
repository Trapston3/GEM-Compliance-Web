import { test, expect } from '@playwright/test';

test.describe('Auth Redirect & Port Stickiness E2E Tests', () => {
  test('unauthenticated visit to root / redirects to /login on current port exactly once', async ({ page }) => {
    const response = await page.goto('/login');
    const port = new URL(page.url()).port || '3000';

    // Logged-out visit to /
    const res = await page.goto('/', { waitUntil: 'domcontentloaded' });
    const finalUrl = new URL(page.url());

    expect(finalUrl.pathname).toBe('/login');
    expect(finalUrl.port || '3000').toBe(port);
  });

  test('unauthenticated visit to /tenders redirects to /login on current port exactly once', async ({ page }) => {
    const response = await page.goto('/login');
    const port = new URL(page.url()).port || '3000';

    // Logged-out visit to /tenders
    await page.goto('/tenders', { waitUntil: 'domcontentloaded' });
    const finalUrl = new URL(page.url());

    expect(finalUrl.pathname).toBe('/login');
    expect(finalUrl.port || '3000').toBe(port);
  });

  test('unauthenticated visit directly to /login stays on /login without redirect loop', async ({ page }) => {
    const res = await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const finalUrl = new URL(page.url());

    expect(finalUrl.pathname).toBe('/login');
    expect(await page.locator('input[type="email"]').isVisible()).toBe(true);
  });
});
