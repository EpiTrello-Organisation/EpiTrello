import { test, expect, uniqueEmail, registerViaApi } from './helpers';

/* ================================================================== */
/*  Auth E2E – Sign-up & Log-in flows                                  */
/* ================================================================== */

test.describe('Sign Up', () => {
  test('shows the sign-up form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
  });

  test('shows validation error when fields are empty', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByText(/tous les champs sont requis/i)).toBeVisible();
  });

  test('shows error for short password', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill('short@test.com');
    await page.getByLabel(/username/i).fill('shortpw');
    await page.locator('#password').fill('abc');
    await page.locator('#confirmPassword').fill('abc');
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByText(/au moins 8 caractères/i)).toBeVisible();
  });

  test('shows error for password mismatch', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill('mismatch@test.com');
    await page.getByLabel(/username/i).fill('mismatch');
    await page.locator('#password').fill('Password123!');
    await page.locator('#confirmPassword').fill('DifferentPw1!');
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByText(/ne correspondent pas/i)).toBeVisible();
  });

  test('registers a new user and redirects to login', async ({ page }) => {
    const email = uniqueEmail('signup');
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/username/i).fill(`newuser_${Date.now()}`);
    await page.locator('#password').fill('Password123!');
    await page.locator('#confirmPassword').fill('Password123!');
    await page.getByRole('button', { name: /sign up/i }).click();

    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('shows error when email is already used', async ({ page }) => {
    const email = uniqueEmail('dup');
    // Register once
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/username/i).fill(`dupuser1_${Date.now()}`);
    await page.locator('#password').fill('Password123!');
    await page.locator('#confirmPassword').fill('Password123!');
    await page.getByRole('button', { name: /sign up/i }).click();
    await page.waitForURL('**/login');

    // Try again with the same email
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/username/i).fill(`dupuser2_${Date.now()}`);
    await page.locator('#password').fill('Password123!');
    await page.locator('#confirmPassword').fill('Password123!');
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByText(/already used/i)).toBeVisible();
  });

  test('has a link to the login page', async ({ page }) => {
    await page.goto('/signup');
    const link = page.getByRole('link', { name: /log in/i });
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL('**/login');
  });
});

test.describe('Log In', () => {
  let email: string;
  const password = 'Password123!';

  test.beforeAll(async () => {
    email = uniqueEmail('login');
    await registerViaApi({ email, username: `login_${Date.now()}`, password });
  });

  test('shows the login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('wrong@test.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test('logs in and navigates to boards', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /continue/i }).click();

    await page.waitForURL('**/boards');
    expect(page.url()).toContain('/boards');

    // Verify token was stored
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
  });

  test('has a link to the signup page', async ({ page }) => {
    await page.goto('/login');
    const link = page.getByRole('link', { name: /sign up/i });
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL('**/signup');
  });
});

test.describe('Auth redirect', () => {
  test('unauthenticated user is redirected to /login from /boards', async ({ page }) => {
    await page.goto('/boards');
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated user is redirected to /login for unknown route', async ({ page }) => {
    await page.goto('/some-unknown-page');
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });
});
