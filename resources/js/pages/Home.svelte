<script lang="ts">
    import { usePage } from '@inertiajs/svelte';
    import { createTranslator } from '../lib/i18n';

    const page = usePage();
    const i18n = $derived(createTranslator(page.props.translations, page.props.locale));
</script>

<svelte:head>
    <title>{i18n.t('app.name')}</title>
</svelte:head>

<main>
    <h1>{i18n.t('home.title')}</h1>
    <p>{i18n.t('home.tagline')}</p>
    <p role="status">{i18n.t('home.status')}</p>
</main>
