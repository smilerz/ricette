import { expect, test } from '@playwright/test';

test('the home page renders through Inertia and Svelte', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Welcome to Ricette' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('The application is running.');
});
