import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { baseKey, main, pseudoLocalize, usedKeys, validate, writePseudoLocale } from './i18n.mjs';

let root: string;

function write(path: string, contents: string): void {
    const full = join(root, path);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, contents);
}

function catalog(locale: string, messages: Record<string, string>): void {
    write(`lang/${locale}.json`, JSON.stringify(messages));
}

beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'i18n-'));
});

afterEach(() => {
    rmSync(root, { recursive: true, force: true });
});

describe('baseKey', () => {
    it('strips a plural category suffix only', () => {
        expect(baseKey('items.one')).toBe('items');
        expect(baseKey('items.other')).toBe('items');
        expect(baseKey('home.title')).toBe('home.title');
    });
});

describe('validate', () => {
    it('accepts consistent catalogs', () => {
        catalog('en', { 'a.title': 'Title', 'n.one': '{count} item', 'n.other': '{count} items' });
        catalog('de', {
            'a.title': 'Titel',
            'n.one': '{count} Ding',
            'n.other': '{count} Dinge',
            'n.few': '{count} Dinge',
        });

        expect(validate(root)).toEqual([]);
    });

    it('requires the reference catalog', () => {
        catalog('de', { a: 'x' });

        expect(validate(root)).toContain('lang/en.json is required');
    });

    it('reports invalid JSON and non-string values', () => {
        catalog('en', { a: 'x' });
        write('lang/fr.json', '{ nope');
        write('lang/es.json', JSON.stringify({ a: 1 }));

        const problems = validate(root);

        expect(problems).toContain('fr.json: invalid JSON');
        expect(problems).toContain('es.json: "a" must be a string');
    });

    it('rejects a catalog that is not a JSON object', () => {
        catalog('en', { a: 'x' });
        write('lang/fr.json', '[]');

        expect(validate(root)).toContain('fr.json: must be a JSON object');
    });

    it('reports missing and unknown keys', () => {
        catalog('en', { a: 'A', b: 'B' });
        catalog('de', { a: 'A', c: 'C' });

        const problems = validate(root);

        expect(problems).toContain('de.json: missing key "b"');
        expect(problems).toContain('de.json: unknown key "c" (not in en.json)');
    });

    it('reports placeholders the reference does not define', () => {
        catalog('en', { greet: 'Hello, {name}' });
        catalog('de', { greet: 'Hallo, {person}' });

        expect(validate(root)).toContain(
            'de.json: "greet" uses placeholders that en.json does not',
        );
    });

    it('reports a key used in source but missing from the reference', () => {
        catalog('en', { known: 'K' });
        write('resources/js/pages/X.svelte', "<p>{t('known')} {t('unknown.key')}</p>");
        write('resources/js/pages/X.test.ts', "t('ignored.in.tests')");
        write('app/Foo.php', "<?php __('php.key');");
        write('resources/views/a.blade.php', "{{ __('view.key') }}");
        write('app/notes.txt', "t('not.scanned')");

        const problems = validate(root);

        expect(problems).toContain(
            'resources/js/pages/X.svelte: uses "unknown.key" which is not defined in en.json',
        );
        expect(problems.join('\n')).toContain('"php.key"');
        expect(problems.join('\n')).toContain('"view.key"');
        expect(problems.join('\n')).not.toContain('ignored.in.tests');
        expect(problems.join('\n')).not.toContain('not.scanned');
    });

    it('does not compare generated pseudo locales', () => {
        catalog('en', { a: 'A' });
        catalog('en-XA', { extra: 'x' });

        expect(validate(root)).toEqual([]);
    });
});

describe('usedKeys', () => {
    it('finds plural keys by their base and tolerates missing directories', () => {
        write('resources/js/a.ts', "t('items', { count: 2 })");

        expect([...usedKeys(root).keys()]).toEqual(['items']);
    });
});

describe('pseudoLocalize', () => {
    it('accents letters, pads and brackets while preserving placeholders', () => {
        expect(pseudoLocalize('Hi {name}!')).toBe('[Ĥí {name}!~~~~]');
    });

    it('forces right-to-left when asked', () => {
        expect(pseudoLocalize('a', { rtl: true })).toBe('‮[á~]‬');
    });

    it('leaves characters without a mapping alone', () => {
        expect(pseudoLocalize('1 é')).toBe('[1 é~~]');
    });
});

describe('writePseudoLocale', () => {
    it('writes the pseudo locale next to the reference catalog', () => {
        catalog('en', { a: 'a' });

        const path = writePseudoLocale(root);

        expect(path).toBe(join(root, 'lang', 'en-XA.json'));
        expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({ a: '[á~]' });
    });

    it('writes the right-to-left variant to en-XB', () => {
        catalog('en', { a: 'a' });

        expect(writePseudoLocale(root, { rtl: true })).toBe(join(root, 'lang', 'en-XB.json'));
    });
});

describe('main', () => {
    it('exits 0 for valid catalogs and 1 for invalid ones', () => {
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        catalog('en', { a: 'A' });

        expect(main(['validate'], root)).toBe(0);

        catalog('de', { b: 'B' });

        expect(main(['validate'], root)).toBe(1);
    });

    it('writes pseudo locales, honoring --rtl', () => {
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        catalog('en', { a: 'A' });

        expect(main(['pseudo'], root)).toBe(0);
        expect(main(['pseudo', '--rtl'], root)).toBe(0);
        expect(JSON.parse(readFileSync(join(root, 'lang/en-XB.json'), 'utf8'))).toEqual({
            a: '‮[Á~]‬',
        });
    });

    it('prints usage and exits 2 for an unknown command', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        expect(main(['nope'], root)).toBe(2);
        expect(error).toHaveBeenCalled();
    });
});
