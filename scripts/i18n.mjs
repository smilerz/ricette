#!/usr/bin/env node
// Translation validation and pseudo-localization (ADR-0024, Foundation 0 §49).
//
//   node scripts/i18n.mjs validate          check the catalogs against the source
//   node scripts/i18n.mjs pseudo [--rtl]    write lang/en-XA.json (or en-XB.json)
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REFERENCE_LOCALE = 'en';
const PLURAL_SUFFIX = /\.(zero|one|two|few|many|other)$/;
const PLACEHOLDER = /\{(\w+)\}/g;
const GENERATED_LOCALES = new Set(['en-XA', 'en-XB']);

/** @param {string} key */
export function baseKey(key) {
    return key.replace(PLURAL_SUFFIX, '');
}

/** @param {string} message */
function placeholdersOf(message) {
    return new Set([...message.matchAll(PLACEHOLDER)].map((match) => match[1] ?? ''));
}

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
                used.set(baseKey(match[1] ?? ''), relative(root, file));
            }
        }
    }

    return used;
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
    const referencePlaceholders = new Map();

    for (const [key, message] of Object.entries(reference)) {
        const base = baseKey(key);
        const merged = referencePlaceholders.get(base) ?? new Set();

        for (const name of placeholdersOf(message)) {
            merged.add(name);
        }

        referencePlaceholders.set(base, merged);
    }

    for (const [locale, messages] of catalogs) {
        if (locale === REFERENCE_LOCALE || GENERATED_LOCALES.has(locale)) {
            continue;
        }

        const bases = new Set(Object.keys(messages).map(baseKey));

        for (const base of referencePlaceholders.keys()) {
            if (!bases.has(base)) {
                problems.push(`${locale}.json: missing key "${base}"`);
            }
        }

        for (const base of bases) {
            if (!referencePlaceholders.has(base)) {
                problems.push(
                    `${locale}.json: unknown key "${base}" (not in ${REFERENCE_LOCALE}.json)`,
                );
            }
        }

        for (const [key, message] of Object.entries(messages)) {
            const expected = referencePlaceholders.get(baseKey(key));

            if (expected === undefined) {
                continue;
            }

            const actual = placeholdersOf(message);

            if (actual.size > 0 && ![...actual].every((name) => expected.has(name))) {
                problems.push(
                    `${locale}.json: "${key}" uses placeholders that ${REFERENCE_LOCALE}.json does not`,
                );
            }
        }
    }

    for (const [key, file] of usedKeys(root)) {
        if (!referencePlaceholders.has(key)) {
            problems.push(
                `${file}: uses "${key}" which is not defined in ${REFERENCE_LOCALE}.json`,
            );
        }
    }

    return problems;
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
 * Pseudo-localizes a message: accented letters, roughly 40% longer, bracketed so truncation is
 * visible. Placeholders are preserved. With `rtl`, the text is forced right-to-left.
 *
 * @param {string} message
 * @param {{ rtl?: boolean }} [options]
 */
export function pseudoLocalize(message, options = {}) {
    const converted = message
        .split(/(\{\w+\})/)
        .map((part) =>
            /^\{\w+\}$/.test(part) ? part : [...part].map((char) => ACCENTS[char] ?? char).join(''),
        )
        .join('');
    const padding = '~'.repeat(Math.ceil(message.length * 0.4));
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
