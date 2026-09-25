export type Messages = Readonly<Record<string, string>>;
export type Params = Readonly<Record<string, string | number>>;

export interface Translator {
    readonly locale: string;
    readonly t: (key: string, params?: Params) => string;
    readonly formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
    readonly formatDate: (
        value: Date | number | string,
        options?: Intl.DateTimeFormatOptions,
    ) => string;
}

const PLACEHOLDER = /\{(\w+)\}/g;

function interpolate(template: string, params: Params | undefined): string {
    if (params === undefined) {
        return template;
    }

    return template.replace(PLACEHOLDER, (placeholder, name: string) => {
        const value = params[name];

        return value === undefined ? placeholder : String(value);
    });
}

/**
 * Builds the single translation entry point for Svelte code (ADR-0024).
 *
 * Messages come from the flat `lang/{locale}.json` catalogs. A message with a
 * numeric `count` parameter is resolved by CLDR plural category: the key
 * `items.one`, `items.other`, and so on, falling back to `items.other`, then to
 * the bare key. A missing key renders as the key itself so the gap is visible.
 */
export function createTranslator(messages: Messages, locale: string): Translator {
    const plurals = new Intl.PluralRules(locale);

    return {
        locale,
        t(key, params) {
            let template = messages[key];

            if (typeof params?.count === 'number') {
                const category = plurals.select(params.count);
                template = messages[`${key}.${category}`] ?? messages[`${key}.other`] ?? template;
            }

            return interpolate(template ?? key, params);
        },
        formatNumber: (value, options) => new Intl.NumberFormat(locale, options).format(value),
        formatDate: (value, options) =>
            new Intl.DateTimeFormat(locale, options).format(new Date(value)),
    };
}
