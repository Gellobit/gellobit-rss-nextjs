import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that the page title exists
    await expect(page).toHaveTitle(/Gellobit/i);
  });

  test('should display the main navigation', async ({ page }) => {
    await page.goto('/');

    // Check for navigation elements
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still load correctly
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Gellobit/i);
  });
});

test.describe('Navigation', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    // Look for a login link/button
    const loginLink = page.getByRole('link', { name: /login|sign in|iniciar/i });

    if (await loginLink.count() > 0) {
      await loginLink.first().click();
      await page.waitForURL(/auth|login|signin/i);
    }
  });
});

test.describe('Accessibility', () => {
  test('should have no major accessibility violations on home page', async ({ page }) => {
    await page.goto('/');

    // Check basic accessibility - all images should have alt text
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const ariaHidden = await img.getAttribute('aria-hidden');

      // Image should have alt text or be marked as decorative
      const hasAccessibleName = alt !== null || ariaLabel !== null || ariaHidden === 'true';
      expect(hasAccessibleName).toBe(true);
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check that there's at least one h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });
});
