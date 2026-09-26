import { page } from '@inertiajs/svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Home from './Home.svelte';

const translations = {
    'app.name': 'Ricette',
    'home.title': 'Welcome to Ricette',
    'home.tagline': 'Tagline',
    'home.status': 'Running',
    'home.greeting': 'Signed in as {name}',
    'nav.login': 'Sign in',
    'nav.register': 'Create an account',
    'nav.logout': 'Sign out',
    'household.current': 'Household: {name} ({role, select, owner {owner} other {member}})',
    'household.none': "You don't have a household yet.",
    'nav.household_create': 'Create a household',
};

function withPage(
    locale: string,
    messages: Record<string, string>,
    user: { id: number; name: string; email: string } | null = null,
    household: { id: number; name: string; role: 'owner' | 'member' } | null = null,
    registrationOpen = true,
): void {
    Object.assign(page, {
        component: 'Home',
        props: {
            locale,
            fallbackLocale: 'en',
            translations: messages,
            auth: { user },
            household,
            registrationOpen,
        },
        url: '/',
        version: null,
    });
}

describe('Home', () => {
    it('renders its translated heading and status', () => {
        withPage('en', translations);
        render(Home);

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome to Ricette');
        expect(screen.getByRole('status')).toHaveTextContent('Running');
    });

    it('renders the keys when no translation exists', () => {
        withPage('xx', {});
        render(Home);

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('home.title');
    });

    it('offers sign-in and registration to a guest', () => {
        withPage('en', translations);
        render(Home);

        expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Create an account' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
    });

    it('offers only sign-in to a guest when registration is closed', () => {
        withPage('en', translations, null, null, false);
        render(Home);

        expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Create an account' })).not.toBeInTheDocument();
    });

    it('greets a signed-in user and offers sign-out', () => {
        withPage('en', translations, { id: 1, name: 'Ana', email: 'ana@example.com' });
        render(Home);

        expect(screen.getByText('Signed in as Ana')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
    });

    it('shows the active household and role to a signed-in user', () => {
        withPage(
            'en',
            translations,
            { id: 1, name: 'Ana', email: 'ana@example.com' },
            { id: 5, name: 'Home', role: 'owner' },
        );
        render(Home);

        expect(screen.getByText('Household: Home (owner)')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Create a household' })).not.toBeInTheDocument();
    });

    it('shows a member role differently from an owner', () => {
        withPage(
            'en',
            translations,
            { id: 2, name: 'Bo', email: 'bo@example.com' },
            { id: 5, name: 'Home', role: 'member' },
        );
        render(Home);

        expect(screen.getByText('Household: Home (member)')).toBeInTheDocument();
    });

    it('offers to create a household when the user has none', () => {
        withPage('en', translations, { id: 1, name: 'Ana', email: 'ana@example.com' });
        render(Home);

        expect(screen.getByText("You don't have a household yet.")).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Create a household' })).toBeInTheDocument();
    });
});
