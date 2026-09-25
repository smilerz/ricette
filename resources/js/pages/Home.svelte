<script lang="ts">
    import { Form, Link, usePage } from '@inertiajs/svelte';
    import { createTranslator } from '../lib/i18n';

    const page = usePage();
    const i18n = $derived(createTranslator(page.props.translations, page.props.locale));
    const user = $derived(page.props.auth.user);
    const household = $derived(page.props.household);
</script>

<svelte:head>
    <title>{i18n.t('app.name')}</title>
</svelte:head>

<main>
    <h1>{i18n.t('home.title')}</h1>
    <p>{i18n.t('home.tagline')}</p>
    <p role="status">{i18n.t('home.status')}</p>

    {#if user}
        <p>{i18n.t('home.greeting', { name: user.name })}</p>
        {#if household}
            <p>{i18n.t('household.current', { name: household.name, role: household.role })}</p>
        {:else}
            <p>{i18n.t('household.none')}</p>
            <p><Link href="/households/create">{i18n.t('nav.household_create')}</Link></p>
        {/if}
        <Form action="/logout" method="post">
            <button type="submit">{i18n.t('nav.logout')}</button>
        </Form>
    {:else}
        <p>
            <Link href="/login">{i18n.t('nav.login')}</Link> ·
            <Link href="/register">{i18n.t('nav.register')}</Link>
        </p>
    {/if}
</main>
