import { expect, test } from '@playwright/test';

const password = 'correct horse battery staple';

test('a signed-in person creates a household and becomes its owner', async ({ page }) => {
    const email = `owner-${String(Date.now())}@example.com`;

    await page.goto('/register');
    await page.getByLabel('Name').fill('Olive');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText("You don't have a household yet.")).toBeVisible();
    await page.getByRole('link', { name: 'Create a household' }).click();

    await page.getByLabel('Household name').fill('The Olive household');
    await page.getByRole('button', { name: 'Create household' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Household: The Olive household (owner)')).toBeVisible();

    // The household is still there after signing out and back in.
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Household: The Olive household (owner)')).toBeVisible();
});

test('a guest cannot reach household creation', async ({ page }) => {
    await page.goto('/households/create');

    await expect(page).toHaveURL(/\/login$/);
});
