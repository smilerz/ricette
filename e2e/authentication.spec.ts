import { expect, test } from '@playwright/test';

const password = 'correct horse battery staple';

test('a person registers, signs in, and signs out', async ({ page }) => {
    const email = `ana-${String(Date.now())}@Example.com`;

    await page.goto('/register');
    await page.getByLabel('Name').fill('Ana');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('status')).toHaveText(
        'Your registration was received. Sign in to continue.',
    );

    // The address is matched regardless of case.
    await page.getByLabel('Email address').fill(email.toLowerCase());
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Signed in as Ana')).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
});

test('registering the same address again gets the same response', async ({ page }) => {
    const email = `dup-${String(Date.now())}@example.com`;

    for (const attempt of [1, 2]) {
        await page.goto('/register');
        await page.getByLabel('Name').fill(`Person ${String(attempt)}`);
        await page.getByLabel('Email address').fill(email);
        await page.getByLabel('Password', { exact: true }).fill(password);
        await page.getByLabel('Confirm password').fill(password);
        await page.getByRole('button', { name: 'Create account' }).click();

        await expect(page).toHaveURL(/\/login$/);
        await expect(page.getByRole('status')).toHaveText(
            'Your registration was received. Sign in to continue.',
        );
    }
});

test('a wrong password is refused', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('nobody@example.com');
    await page.getByLabel('Password').fill('not the password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toHaveText('These credentials do not match our records.');
});
