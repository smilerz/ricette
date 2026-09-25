import { IntlMessageFormat } from 'intl-messageformat';

export type Messages = Readonly<Record<string, string>>;
export type Params = Readonly<Record<string, string | number | Date>>;

export interface Translator {
    readonly locale: string;
    readonly t: (key: string, params?: Params) => string;
    readonly formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
    readonly formatDate: (
        value: Date | number | string,
        options?: Intl.DateTimeFormatOptions,
    ) => string;
}

/**
 * Builds the single translation entry point for Svelte code (ADR-0024).
 *
 * Catalog values are ICU MessageFormat strings, so plurals, selects and formatted
 * arguments follow each language's CLDR rules. A missing key, a message that fails to
 * parse, and a message whose arguments were not supplied all render as the key itself,
 * so the gap is visible instead of showing a broken sentence. `bin/verify` catches
 * invalid messages before they ship.
 */
export function createTranslator(messages: Messages, locale: string): Translator {
    const formatters = new Map<string, IntlMessageFormat | null>();

    function formatterFor(key: string, message: string): IntlMessageFormat | null {
        if (!formatters.has(key)) {
            try {
                formatters.set(key, new IntlMessageFormat(message, locale));
            } catch {
                formatters.set(key, null);
            }
        }

        return formatters.get(key) ?? null;
    }

    return {
        locale,
        t(key, params) {
            const message = messages[key];

            if (message === undefined) {
                return key;
            }

            const formatter = formatterFor(key, message);

            if (formatter === null) {
                return key;
            }

            try {
                const formatted = formatter.format(params);

                return Array.isArray(formatted) ? formatted.join('') : String(formatted);
            } catch {
                return key;
            }
        },
        formatNumber: (value, options) => new Intl.NumberFormat(locale, options).format(value),
        formatDate: (value, options) =>
            new Intl.DateTimeFormat(locale, options).format(new Date(value)),
    };
}
