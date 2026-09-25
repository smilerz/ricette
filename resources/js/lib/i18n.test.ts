import { describe, expect, it } from 'vitest';
import { createTranslator } from './i18n';

const messages = {
    greeting: 'Hello',
    'greeting.named': 'Hello, {name}',
    items: '{count, plural, one {# item} other {# items}}',
    role: '{kind, select, admin {Administrator} other {Member}}',
    broken: 'Hello {name',
};

describe('createTranslator', () => {
    const { t } = createTranslator(messages, 'en');

    it('returns a message by key', () => {
        expect(t('greeting')).toBe('Hello');
    });

    it('interpolates named arguments', () => {
        expect(t('greeting.named', { name: 'Ana' })).toBe('Hello, Ana');
    });

    it('renders the key when an argument is not supplied', () => {
        expect(t('greeting.named')).toBe('greeting.named');
        expect(t('greeting.named', { other: 'x' })).toBe('greeting.named');
    });

    it('renders a missing key as the key so the gap is visible', () => {
        expect(t('does.not.exist')).toBe('does.not.exist');
    });

    it('renders the key for a message that does not parse', () => {
        expect(t('broken', { name: 'Ana' })).toBe('broken');
        expect(t('broken', { name: 'Ana' })).toBe('broken');
    });

    it('selects a plural form by CLDR category', () => {
        expect(t('items', { count: 1 })).toBe('1 item');
        expect(t('items', { count: 2 })).toBe('2 items');
        expect(t('items', { count: 1000 })).toBe('1,000 items');
    });

    it('supports select messages', () => {
        expect(t('role', { kind: 'admin' })).toBe('Administrator');
        expect(t('role', { kind: 'anything' })).toBe('Member');
    });

    it('uses the locale plural rules beyond one and other', () => {
        const arabic = createTranslator(
            {
                items: '{count, plural, zero {none} one {one} two {two} few {few} many {many} other {other}}',
            },
            'ar',
        );

        expect(arabic.t('items', { count: 0 })).toBe('none');
        expect(arabic.t('items', { count: 2 })).toBe('two');
        expect(arabic.t('items', { count: 3 })).toBe('few');
        expect(arabic.t('items', { count: 11 })).toBe('many');
        expect(arabic.t('items', { count: 100 })).toBe('other');
    });

    it('formats numbers inside messages for the locale', () => {
        const german = createTranslator({ total: '{value, number}' }, 'de');

        expect(german.t('total', { value: 1234.5 })).toBe('1.234,5');
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
