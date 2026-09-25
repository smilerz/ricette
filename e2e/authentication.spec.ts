import { expect, test, type Page } from '@playwright/test';

const password = 'correct horse battery staple';

async function register(page: Page, name: string, email: string): Promise<void> {
    await page.goto('/register');
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
}

test('a person registers, signs out, and signs back in', async ({ page }) => {
    const email = `ana-${String(Date.now())}@Example.com`;

    await register(page, 'Ana', email);

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Signed in as Ana')).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();

    // The address is matched regardless of case.
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email.toLowerCase());
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Signed in as Ana')).toBeVisible();
});

test('registering an address that is already in use is refused', async ({ page }) => {
    const email = `dup-${String(Date.now())}@example.com`;

    await register(page, 'First', email);
    await expect(page.getByText('Signed in as First')).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();

    await register(page, 'Second', email.toUpperCase());

    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('alert')).toHaveText("This email address can't be used.");
});

test('a wrong password is refused', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('nobody@example.com');
    await page.getByLabel('Password').fill('not the password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toHaveText('These credentials do not match our records.');
});
