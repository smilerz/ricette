#!/usr/bin/env node
// Translation validation and pseudo-localization (ADR-0024, Foundation 0 §49).
//
//   node scripts/i18n.mjs validate          check the catalogs against the source
//   node scripts/i18n.mjs pseudo [--rtl]    write lang/en-XA.json (or en-XB.json)
//
// Catalog values are ICU MessageFormat strings.
import { parse, TYPE } from '@formatjs/icu-messageformat-parser';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REFERENCE_LOCALE = 'en';
const GENERATED_LOCALES = new Set(['en-XA', 'en-XB']);

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listFiles(dir) {
    if (!existsSync(dir)) {
        return [];
    }

    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);

        return entry.isDirectory() ? listFiles(path) : [path];
    });
}

/**
 * Keys referenced from source: `t('key')` in Svelte/TypeScript, `__('key')` in PHP and Blade.
 *
 * @param {string} root
 * @returns {Map<string, string>} key -> first file that uses it
 */
export function usedKeys(root) {
    /** @type {Map<string, string>} */
    const used = new Map();
    const sources = [
        {
            dir: join(root, 'resources/js'),
            pattern: /\bt\(\s*['"]([\w.-]+)['"]/g,
            extensions: ['.ts', '.svelte'],
        },
        { dir: join(root, 'app'), pattern: /\b__\(\s*['"]([\w.-]+)['"]/g, extensions: ['.php'] },
        {
            dir: join(root, 'resources/views'),
            pattern: /\b__\(\s*['"]([\w.-]+)['"]/g,
            extensions: ['.php'],
        },
    ];

    for (const { dir, pattern, extensions } of sources) {
        for (const file of listFiles(dir)) {
            if (
                !extensions.some((extension) => file.endsWith(extension)) ||
                file.endsWith('.test.ts')
            ) {
                continue;
            }

            for (const match of readFileSync(file, 'utf8').matchAll(pattern)) {
                used.set(match[1] ?? '', relative(root, file));
            }
        }
    }

    return used;
}

const KIND = /** @type {Record<number, string>} */ ({
    [TYPE.argument]: 'argument',
    [TYPE.number]: 'number',
    [TYPE.date]: 'date',
    [TYPE.time]: 'time',
    [TYPE.select]: 'select',
    [TYPE.plural]: 'plural',
    [TYPE.tag]: 'tag',
});

/**
 * Calls `visit` for every element, descending into plural/select options and tags.
 *
 * @param {import('@formatjs/icu-messageformat-parser').MessageFormatElement[]} elements
 * @param {(element: import('@formatjs/icu-messageformat-parser').MessageFormatElement) => void} visit
 */
function walk(elements, visit) {
    for (const element of elements) {
        visit(element);

        if (element.type === TYPE.plural || element.type === TYPE.select) {
            for (const option of Object.values(element.options)) {
                walk(option.value, visit);
            }
        } else if (element.type === TYPE.tag) {
            walk(element.children, visit);
        }
    }
}

/**
 * The arguments a message takes, as "name:kind" strings, and the problems found in it.
 *
 * @param {string} message
 * @param {string} locale
 * @returns {{ args: Set<string>, problems: string[] }}
 */
export function analyze(message, locale) {
    /** @type {string[]} */
    const problems = [];
    const args = new Set();
    /** @type {import('@formatjs/icu-messageformat-parser').MessageFormatElement[]} */
    let ast;

    try {
        ast = parse(message);
    } catch (error) {
        return {
            args,
            problems: [
                `invalid ICU message: ${error instanceof Error ? error.message : String(error)}`,
            ],
        };
    }

    const required = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;

    walk(ast, (element) => {
        const kind = KIND[element.type];

        if (kind !== undefined) {
            args.add(`${'value' in element ? String(element.value) : ''}:${kind}`);
        }

        if (element.type === TYPE.plural && element.pluralType !== 'ordinal') {
            const missing = required.filter((category) => !(category in element.options));

            if (missing.length > 0) {
                problems.push(
                    `plural "${element.value}" for ${locale} needs categories: ${missing.join(', ')}`,
                );
            }
        }
    });

    return { args, problems };
}

/**
 * @param {string} root repository root
 * @returns {string[]} problems; empty when the catalogs are valid
 */
export function validate(root) {
    /** @type {string[]} */
    const problems = [];
    const langDir = join(root, 'lang');
    /** @type {Map<string, Record<string, string>>} */
    const catalogs = new Map();

    for (const file of readdirSync(langDir).filter((name) => name.endsWith('.json'))) {
        const locale = file.slice(0, -'.json'.length);

        try {
            const parsed = /** @type {unknown} */ (
                JSON.parse(readFileSync(join(langDir, file), 'utf8'))
            );

            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                problems.push(`${file}: must be a JSON object`);
                continue;
            }

            /** @type {Record<string, string>} */
            const messages = {};

            for (const [key, value] of Object.entries(parsed)) {
                if (typeof value === 'string') {
                    messages[key] = value;
                } else {
                    problems.push(`${file}: "${key}" must be a string`);
                }
            }

            catalogs.set(locale, messages);
        } catch {
            problems.push(`${file}: invalid JSON`);
        }
    }

    const reference = catalogs.get(REFERENCE_LOCALE);

    if (reference === undefined) {
        return [...problems, `lang/${REFERENCE_LOCALE}.json is required`];
    }

    /** @type {Map<string, Set<string>>} */
    const referenceArgs = new Map();

    for (const [locale, messages] of catalogs) {
        if (GENERATED_LOCALES.has(locale)) {
            continue;
        }

        for (const [key, message] of Object.entries(messages)) {
            const result = analyze(message, locale);

            for (const problem of result.problems) {
                problems.push(`${locale}.json: "${key}": ${problem}`);
            }

            if (locale === REFERENCE_LOCALE) {
                referenceArgs.set(key, result.args);
                continue;
            }

            const expected = referenceArgs.get(key) ?? analyzeReference(reference, key);

            if (expected !== undefined && !sameSet(result.args, expected)) {
                problems.push(
                    `${locale}.json: "${key}" takes different arguments than ${REFERENCE_LOCALE}.json`,
                );
            }
        }

        if (locale === REFERENCE_LOCALE) {
            continue;
        }

        for (const key of Object.keys(reference)) {
            if (!(key in messages)) {
                problems.push(`${locale}.json: missing key "${key}"`);
            }
        }

        for (const key of Object.keys(messages)) {
            if (!(key in reference)) {
                problems.push(
                    `${locale}.json: unknown key "${key}" (not in ${REFERENCE_LOCALE}.json)`,
                );
            }
        }
    }

    for (const [key, file] of usedKeys(root)) {
        if (!(key in reference)) {
            problems.push(
                `${file}: uses "${key}" which is not defined in ${REFERENCE_LOCALE}.json`,
            );
        }
    }

    return problems;
}

/**
 * @param {Record<string, string>} reference
 * @param {string} key
 * @returns {Set<string> | undefined}
 */
function analyzeReference(reference, key) {
    const message = reference[key];

    return message === undefined ? undefined : analyze(message, REFERENCE_LOCALE).args;
}

/**
 * @param {Set<string>} a
 * @param {Set<string>} b
 */
function sameSet(a, b) {
    return a.size === b.size && [...a].every((item) => b.has(item));
}

const ACCENTS = /** @type {Record<string, string>} */ ({
    a: 'á',
    b: 'ƀ',
    c: 'ç',
    d: 'ð',
    e: 'é',
    f: 'ƒ',
    g: 'ĝ',
    h: 'ĥ',
    i: 'í',
    j: 'ĵ',
    k: 'ķ',
    l: 'ĺ',
    m: 'ɱ',
    n: 'ñ',
    o: 'ó',
    p: 'þ',
    q: 'ǫ',
    r: 'ŕ',
    s: 'š',
    t: 'ţ',
    u: 'ú',
    v: 'ṽ',
    w: 'ŵ',
    x: 'ẋ',
    y: 'ý',
    z: 'ž',
    A: 'Á',
    B: 'Ɓ',
    C: 'Ç',
    D: 'Ð',
    E: 'É',
    F: 'Ƒ',
    G: 'Ĝ',
    H: 'Ĥ',
    I: 'Í',
    J: 'Ĵ',
    K: 'Ķ',
    L: 'Ĺ',
    M: 'Ṁ',
    N: 'Ñ',
    O: 'Ó',
    P: 'Þ',
    Q: 'Ǫ',
    R: 'Ŕ',
    S: 'Š',
    T: 'Ţ',
    U: 'Ú',
    V: 'Ṽ',
    W: 'Ŵ',
    X: 'Ẋ',
    Y: 'Ý',
    Z: 'Ž',
});

/**
 * Pseudo-localizes an ICU message: accented letters in the literal text, roughly 40% longer,
 * bracketed so truncation is visible. Arguments, plural and select structure are preserved.
 * With `rtl`, the text is forced right-to-left.
 *
 * @param {string} message
 * @param {{ rtl?: boolean }} [options]
 */
export function pseudoLocalize(message, options = {}) {
    const ast = parse(message, { captureLocation: true });
    /** @type {{ start: number, end: number }[]} */
    const literals = [];
    let literalLength = 0;

    walk(ast, (element) => {
        if (element.type === TYPE.literal && element.location) {
            literals.push({
                start: element.location.start.offset,
                end: element.location.end.offset,
            });
            literalLength += element.value.length;
        }
    });

    let converted = message;

    for (const { start, end } of literals.sort((a, b) => b.start - a.start)) {
        const text = [...converted.slice(start, end)].map((char) => ACCENTS[char] ?? char).join('');

        converted = converted.slice(0, start) + text + converted.slice(end);
    }

    const padding = '~'.repeat(Math.ceil(literalLength * 0.4));
    const text = `[${converted}${padding}]`;

    return options.rtl === true ? `‮${text}‬` : text;
}

/**
 * @param {string} root
 * @param {{ rtl?: boolean }} [options]
 * @returns {string} path written
 */
export function writePseudoLocale(root, options = {}) {
    const reference = /** @type {Record<string, string>} */ (
        JSON.parse(readFileSync(join(root, 'lang', `${REFERENCE_LOCALE}.json`), 'utf8'))
    );
    const pseudo = Object.fromEntries(
        Object.entries(reference).map(([key, message]) => [key, pseudoLocalize(message, options)]),
    );
    const path = join(root, 'lang', options.rtl === true ? 'en-XB.json' : 'en-XA.json');

    writeFileSync(path, `${JSON.stringify(pseudo, null, 2)}\n`);

    return path;
}

/**
 * @param {string[]} args
 * @param {string} root
 * @returns {number} process exit code
 */
export function main(args, root) {
    const [command, ...flags] = args;

    if (command === 'validate') {
        const problems = validate(root);

        for (const problem of problems) {
            console.error(problem);
        }

        console.log(
            problems.length === 0
                ? 'i18n: catalogs are valid'
                : `i18n: ${String(problems.length)} problem(s)`,
        );

        return problems.length === 0 ? 0 : 1;
    }

    if (command === 'pseudo') {
        console.log(
            `wrote ${relative(root, writePseudoLocale(root, { rtl: flags.includes('--rtl') }))}`,
        );

        return 0;
    }

    console.error('usage: node scripts/i18n.mjs validate | pseudo [--rtl]');

    return 2;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    process.exit(main(process.argv.slice(2), process.cwd()));
}
