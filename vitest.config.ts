import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts: laravel-vite-plugin refuses to load in CI.
export default defineConfig({
    plugins: [svelte()],
    resolve: {
        conditions: ['browser'],
    },
    test: {
        environment: 'jsdom',
        include: ['resources/js/**/*.test.ts', 'scripts/**/*.test.ts'],
        setupFiles: ['resources/js/test-setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'json-summary'],
            include: ['resources/js/**/*.{ts,svelte}', 'scripts/**/*.mjs'],
            // The entry file is Inertia glue exercised by the Playwright journey.
            exclude: [
                '**/*.test.ts',
                'resources/js/app.ts',
                'resources/js/test-setup.ts',
                'resources/js/types/**',
            ],
            thresholds: {
                lines: 85,
                statements: 85,
                functions: 85,
                branches: 80,
            },
        },
    },
});
