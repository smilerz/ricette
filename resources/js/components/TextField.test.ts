import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import TextField from './TextField.svelte';

describe('TextField', () => {
    it('renders a labelled, required input', () => {
        render(TextField, { name: 'email', label: 'Email', type: 'email', autocomplete: 'email' });

        const input = screen.getByLabelText('Email');

        expect(input).toBeRequired();
        expect(input).toHaveAttribute('type', 'email');
        expect(input).toHaveAttribute('autocomplete', 'email');
        expect(input).not.toHaveAttribute('aria-invalid');
        expect(input).not.toHaveAttribute('aria-describedby');
    });

    it('defaults to a text input', () => {
        render(TextField, { name: 'name', label: 'Name' });

        expect(screen.getByLabelText('Name')).toHaveAttribute('type', 'text');
    });

    it('announces an error and ties it to the input', () => {
        render(TextField, { name: 'email', label: 'Email', error: 'Enter a valid email address.' });

        const input = screen.getByLabelText('Email');

        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAccessibleDescription('Enter a valid email address.');
        expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
    });

    it('describes the input with its hint and error together', () => {
        render(TextField, {
            name: 'password',
            label: 'Password',
            type: 'password',
            minlength: 12,
            hint: 'At least 12 characters.',
            error: 'Too short.',
        });

        const input = screen.getByLabelText('Password');

        expect(input).toHaveAttribute('minlength', '12');
        expect(input).toHaveAccessibleDescription('At least 12 characters. Too short.');
    });
});
