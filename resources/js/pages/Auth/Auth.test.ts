import { page } from '@inertiajs/svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Login from './Login.svelte';
import Register from './Register.svelte';

const translations = {
    'app.name': 'Ricette',
    'auth.login.title': 'Sign in',
    'auth.register.title': 'Create an account',
    'auth.field.name': 'Name',
    'auth.field.email': 'Email address',
    'auth.field.password': 'Password',
    'auth.field.password_confirmation': 'Confirm password',
    'auth.password_hint': 'At least 12 characters.',
    'auth.login.submit': 'Sign in',
    'auth.register.submit': 'Create account',
    'auth.need_account': 'New here?',
    'auth.have_account': 'Already registered?',
};

function withPage(): void {
    Object.assign(page, {
        component: 'Auth',
        props: {
            locale: 'en',
            fallbackLocale: 'en',
            translations,
            auth: { user: null },
        },
        url: '/login',
        version: null,
    });
}

describe('Login', () => {
    it('renders the sign-in form', () => {
        withPage();
        render(Login);

        expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
        expect(screen.getByLabelText('Email address')).toHaveAttribute('type', 'email');
        expect(screen.getByLabelText('Password')).toHaveAttribute(
            'autocomplete',
            'current-password',
        );
        expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
        expect(screen.getByRole('link', { name: 'New here?' })).toBeInTheDocument();
    });
});

describe('Register', () => {
    it('renders the registration form', () => {
        withPage();
        render(Register);

        expect(
            screen.getByRole('heading', { level: 1, name: 'Create an account' }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Name')).toBeRequired();
        expect(screen.getByLabelText('Email address')).toHaveAttribute('type', 'email');
        expect(screen.getByLabelText('Password')).toHaveAttribute('minlength', '12');
        expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
            'At least 12 characters.',
        );
        expect(screen.getByLabelText('Confirm password')).toHaveAttribute(
            'autocomplete',
            'new-password',
        );
        expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled();
        expect(screen.getByRole('link', { name: 'Already registered?' })).toBeInTheDocument();
    });
});
