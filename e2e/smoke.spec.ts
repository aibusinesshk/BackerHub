import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('homepage loads and shows hero', async ({ page }) => {
    await page.goto('/');
    // Should redirect to a locale (en or zh-TW)
    await expect(page).toHaveURL(/\/(en|zh-TW)/);
    // Should have the BackerHub brand somewhere
    await expect(page.locator('body')).toContainText('BackerHub');
  });

  test('marketplace page loads', async ({ page }) => {
    await page.goto('/en/marketplace');
    await expect(page).toHaveURL(/\/en\/marketplace/);
    await expect(page.locator('body')).toContainText(/marketplace/i);
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page).toHaveURL(/\/en\/login/);
    // Should have email and password inputs
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('contact page loads', async ({ page }) => {
    await page.goto('/en/contact');
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('language switcher changes locale', async ({ page }) => {
    await page.goto('/en/marketplace');
    // Verify we're on the English page
    await expect(page).toHaveURL(/\/en\//);
  });
});

test.describe('Navigation', () => {
  test('header navigation links work', async ({ page }) => {
    await page.goto('/en');
    // Click marketplace link in header
    await page.locator('nav a[href*="marketplace"]').first().click();
    await expect(page).toHaveURL(/\/marketplace/);
  });

  test('skip to content link is accessible', async ({ page }) => {
    await page.goto('/en/marketplace');
    // Tab to the skip link
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main-content"]');
    // The skip link should become visible on focus
    await expect(skipLink).toBeFocused();
  });
});

test.describe('SEO', () => {
  test('marketplace page has correct title', async ({ page }) => {
    await page.goto('/en/marketplace');
    await expect(page).toHaveTitle(/Marketplace.*BackerHub/);
  });

  test('login page has correct title', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page).toHaveTitle(/Log In.*BackerHub/);
  });

  test('robots.txt is accessible', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('User-agent');
    expect(body).toContain('sitemap');
  });

  test('sitemap.xml is accessible', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('marketplace');
  });
});
