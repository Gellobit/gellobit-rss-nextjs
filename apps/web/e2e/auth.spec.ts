import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login form on auth page', async ({ page }) => {
    await page.goto('/auth');

    // Wait for the auth form to load
    await page.waitForLoadState('networkidle');

    // Check for email input
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible();

    // Check for password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Find and click submit button
    const submitButton = page.getByRole('button', { name: /sign in|login|entrar|iniciar/i });

    if (await submitButton.count() > 0) {
      await submitButton.first().click();

      // Wait a moment for validation
      await page.waitForTimeout(500);

      // Check for validation - either HTML5 validation or custom error message
      const emailInput = page.getByRole('textbox', { name: /email/i });
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);

      // Either there's a validation message or the form shows an error
      const hasValidation = validationMessage.length > 0 || (await page.locator('[role="alert"]').count()) > 0;
      expect(hasValidation).toBe(true);
    }
  });

  test('should have a link to sign up', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Look for sign up / register link or button
    const signUpLink = page.getByRole('button', { name: /sign up|register|crear cuenta|registr/i })
      .or(page.getByRole('link', { name: /sign up|register|crear cuenta|registr/i }))
      .or(page.getByRole('tab', { name: /sign up|register|crear cuenta|registr/i }));

    // There should be some way to switch to sign up
    expect(await signUpLink.count()).toBeGreaterThan(0);
  });

  test('should toggle between login and signup modes', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Find toggle element (tab or link)
    const signUpToggle = page.getByRole('button', { name: /sign up|register|crear cuenta|registr/i })
      .or(page.getByRole('tab', { name: /sign up|register|crear cuenta|registr/i }));

    if (await signUpToggle.count() > 0) {
      await signUpToggle.first().click();
      await page.waitForTimeout(300);

      // After clicking, we should see a confirm password field or similar signup indicator
      const confirmPassword = page.locator('input[name="confirmPassword"], input[placeholder*="confirm"]');
      const signUpButton = page.getByRole('button', { name: /create account|sign up|registrar/i });

      const isSignUpMode = (await confirmPassword.count()) > 0 || (await signUpButton.count()) > 0;
      expect(isSignUpMode).toBe(true);
    }
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to auth page when accessing protected route', async ({ page }) => {
    // Try to access a protected route (admin)
    await page.goto('/admin');

    // Should redirect to auth page
    await expect(page).toHaveURL(/auth/);
  });

  test('should redirect to auth when accessing account page', async ({ page }) => {
    await page.goto('/account');

    // Should redirect to auth page or show login prompt
    const url = page.url();
    const isAuthRedirect = url.includes('auth') || url.includes('login');
    expect(isAuthRedirect).toBe(true);
  });
});
