import { page } from '@inertiajs/svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Create from './Create.svelte';

const translations = {
    'app.name': 'Ricette',
    'household.create.title': 'Create a household',
    'household.field.name': 'Household name',
    'household.create.submit': 'Create household',
};

describe('Create household', () => {
    it('asks only for a name', () => {
        Object.assign(page, {
            component: 'Households/Create',
            props: {
                locale: 'en',
                fallbackLocale: 'en',
                translations,
                auth: { user: { id: 1, name: 'Ana', email: 'ana@example.com' } },
                household: null,
            },
            url: '/households/create',
            version: null,
        });
        render(Create);

        expect(
            screen.getByRole('heading', { level: 1, name: 'Create a household' }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Household name')).toBeRequired();
        expect(screen.getAllByRole('textbox')).toHaveLength(1);
        expect(screen.getByRole('button', { name: 'Create household' })).toBeEnabled();
    });
});
