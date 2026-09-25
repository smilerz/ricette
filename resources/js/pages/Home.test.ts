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
};

function withPage(
    locale: string,
    messages: Record<string, string>,
    user: { id: number; name: string; email: string } | null = null,
): void {
    Object.assign(page, {
        component: 'Home',
        props: {
            locale,
            fallbackLocale: 'en',
            translations: messages,
            auth: { user },
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

    it('greets a signed-in user and offers sign-out', () => {
        withPage('en', translations, { id: 1, name: 'Ana', email: 'ana@example.com' });
        render(Home);

        expect(screen.getByText('Signed in as Ana')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
    });
});
