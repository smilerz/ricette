import type { Messages } from '../lib/i18n';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            registrationOpen: boolean;
            locale: string;
            fallbackLocale: string;
            translations: Messages;
            auth: { user: { id: number; name: string; email: string } | null };
            household: { id: number; name: string; role: 'owner' | 'member' } | null;
        };
    }
}
