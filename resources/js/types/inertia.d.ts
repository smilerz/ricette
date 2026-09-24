import type { Messages } from '../lib/i18n';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            locale: string;
            fallbackLocale: string;
            translations: Messages;
        };
    }
}
