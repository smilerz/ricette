import { page } from '@inertiajs/svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Home from './Home.svelte';

const translations = {
    'app.name': 'Ricette',
    'home.title': 'Welcome to Ricette',
    'home.tagline': 'Tagline',
    'home.status': 'Running',
};

function withPage(locale: string, messages: Record<string, string>): void {
    Object.assign(page, {
        component: 'Home',
        props: { locale, fallbackLocale: 'en', translations: messages },
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
});
