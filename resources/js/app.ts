import { createInertiaApp } from '@inertiajs/svelte';
import type { Component } from 'svelte';

const pages = import.meta.glob<{ default: Component }>('./pages/**/*.svelte', { eager: true });

void createInertiaApp({
    resolve: (name) => {
        const page = pages[`./pages/${name}.svelte`];

        if (page === undefined) {
            throw new Error(`Unknown Inertia page: ${name}`);
        }

        return page;
    },
});
