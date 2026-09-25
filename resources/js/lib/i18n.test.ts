import { describe, expect, it } from 'vitest';
import { createTranslator } from './i18n';

const messages = {
    greeting: 'Hello',
    'greeting.named': 'Hello, {name}',
    'items.one': '{count} item',
    'items.other': '{count} items',
    'ratings.other': '{count} ratings',
};

describe('createTranslator', () => {
    const { t } = createTranslator(messages, 'en');

    it('returns a message by key', () => {
        expect(t('greeting')).toBe('Hello');
    });

    it('interpolates named parameters', () => {
        expect(t('greeting.named', { name: 'Ana' })).toBe('Hello, Ana');
    });

    it('leaves an unsupplied placeholder visible', () => {
        expect(t('greeting.named')).toBe('Hello, {name}');
        expect(t('greeting.named', { other: 'x' })).toBe('Hello, {name}');
    });

    it('renders a missing key as the key so the gap is visible', () => {
        expect(t('does.not.exist')).toBe('does.not.exist');
    });

    it('selects a plural form by CLDR category', () => {
        expect(t('items', { count: 1 })).toBe('1 item');
        expect(t('items', { count: 2 })).toBe('2 items');
    });

    it('falls back to the other form when the category has no message', () => {
        expect(t('ratings', { count: 1 })).toBe('1 ratings');
    });

    it('uses the locale plural rules', () => {
        const arabic = createTranslator(
            { 'items.few': 'few:{count}', 'items.other': 'other:{count}' },
            'ar',
        );

        expect(arabic.t('items', { count: 3 })).toBe('few:3');
        expect(arabic.t('items', { count: 100 })).toBe('other:100');
    });

    it('falls back to the bare key when no plural form exists', () => {
        expect(t('greeting', { count: 5 })).toBe('Hello');
    });
});

describe('locale-aware formatting', () => {
    it('formats numbers for the locale', () => {
        expect(createTranslator({}, 'en').formatNumber(1234.5)).toBe('1,234.5');
        expect(createTranslator({}, 'de').formatNumber(1234.5)).toBe('1.234,5');
    });

    it('formats dates for the locale', () => {
        const value = new Date(Date.UTC(2026, 0, 31, 12));
        const options = { timeZone: 'UTC', dateStyle: 'long' } as const;

        expect(createTranslator({}, 'en').formatDate(value, options)).toBe('January 31, 2026');
        expect(createTranslator({}, 'de').formatDate(value, options)).toBe('31. Januar 2026');
    });
});
