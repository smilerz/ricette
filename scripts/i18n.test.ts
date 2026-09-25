import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyze, main, pseudoLocalize, usedKeys, validate, writePseudoLocale } from './i18n.mjs';

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

describe('analyze', () => {
    it('reports the arguments a message takes and their kinds', () => {
        const { args, problems } = analyze(
            'Hi {name}, {count, plural, one {# item} other {# items}} {when, date} <b>{x}</b>',
            'en',
        );

        expect([...args].sort()).toEqual(
            ['count:plural', 'name:argument', 'when:date', 'b:tag', 'x:argument'].sort(),
        );
        expect(problems).toEqual([]);
    });

    it('reports a message that is not valid ICU', () => {
        expect(analyze('Hello {name', 'en').problems[0]).toContain('invalid ICU message');
    });

    it('requires every plural category the language uses', () => {
        const { problems } = analyze('{n, plural, one {a} other {b}}', 'pl');

        expect(problems).toEqual(['plural "n" for pl needs categories: few, many']);
    });

    it('accepts a plural that covers the language categories', () => {
        expect(analyze('{n, plural, one {a} few {b} many {c} other {d}}', 'pl').problems).toEqual(
            [],
        );
    });

    it('does not require categories for ordinals', () => {
        expect(analyze('{n, selectordinal, one {#st} other {#th}}', 'en').problems).toEqual([]);
    });
});

describe('validate', () => {
    it('accepts consistent catalogs', () => {
        catalog('en', { 'a.title': 'Title', n: '{count, plural, one {# item} other {# items}}' });
        catalog('de', { 'a.title': 'Titel', n: '{count, plural, one {# Ding} other {# Dinge}}' });

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

    it('reports invalid ICU messages', () => {
        catalog('en', { a: 'Hello {name' });

        expect(validate(root).join('\n')).toContain('en.json: "a": invalid ICU message');
    });

    it('reports missing and unknown keys', () => {
        catalog('en', { a: 'A', b: 'B' });
        catalog('de', { a: 'A', c: 'C' });

        const problems = validate(root);

        expect(problems).toContain('de.json: missing key "b"');
        expect(problems).toContain('de.json: unknown key "c" (not in en.json)');
    });

    it('reports arguments that differ from the reference', () => {
        catalog('en', { greet: 'Hello, {name}' });
        catalog('de', { greet: 'Hallo, {person}' });

        expect(validate(root)).toContain('de.json: "greet" takes different arguments than en.json');
    });

    it('reports a plural that lacks a category the language needs', () => {
        catalog('en', { n: '{c, plural, one {# a} other {# b}}' });
        catalog('pl', { n: '{c, plural, one {# a} other {# b}}' });

        expect(validate(root).join('\n')).toContain(
            'plural "c" for pl needs categories: few, many',
        );
    });

    it('checks a translation against a reference that sorts after it', () => {
        catalog('de', { greet: 'Hallo, {person}' });
        catalog('en', { greet: 'Hello, {name}' });

        expect(validate(root)).toContain('de.json: "greet" takes different arguments than en.json');
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
    it('finds keys and tolerates missing directories', () => {
        write('resources/js/a.ts', "t('items', { count: 2 })");

        expect([...usedKeys(root).keys()]).toEqual(['items']);
    });
});

describe('pseudoLocalize', () => {
    it('accents literal text, pads and brackets while preserving arguments', () => {
        expect(pseudoLocalize('Hi {name}!')).toBe('[Ĥí {name}!~~]');
    });

    it('accents the text inside plural and select branches only', () => {
        expect(pseudoLocalize('{n, plural, one {# item} other {# items}}')).toBe(
            '[{n, plural, one {# íţéɱ} other {# íţéɱš}}~~~~~]',
        );
        expect(pseudoLocalize('{k, select, a {yes} other {no}}')).toBe(
            '[{k, select, a {ýéš} other {ñó}}~~]',
        );
    });

    it('forces right-to-left when asked', () => {
        expect(pseudoLocalize('a', { rtl: true })).toBe('\u202e[á~]\u202c');
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
