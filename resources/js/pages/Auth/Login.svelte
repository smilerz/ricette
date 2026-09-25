<script lang="ts">
    import type { FormComponentSlotProps } from '@inertiajs/core';
    import { Form, Link, usePage } from '@inertiajs/svelte';
    import TextField from '../../components/TextField.svelte';
    import { createTranslator } from '../../lib/i18n';

    const page = usePage();
    const i18n = $derived(createTranslator(page.props.translations, page.props.locale));
</script>

<svelte:head>
    <title>{i18n.t('auth.login.title')} - {i18n.t('app.name')}</title>
</svelte:head>

<main>
    <h1>{i18n.t('auth.login.title')}</h1>

    <Form action="/login" method="post" resetOnError={['password']}>
        {#snippet children({ errors, processing }: FormComponentSlotProps)}
            <TextField
                name="email"
                type="email"
                autocomplete="email"
                label={i18n.t('auth.field.email')}
                error={errors.email ? i18n.t(errors.email) : undefined}
            />
            <TextField
                name="password"
                type="password"
                autocomplete="current-password"
                label={i18n.t('auth.field.password')}
            />
            <button type="submit" disabled={processing}>{i18n.t('auth.login.submit')}</button>
        {/snippet}
    </Form>

    {#if page.props.registrationOpen}
        <p><Link href="/register">{i18n.t('auth.need_account')}</Link></p>
    {/if}
</main>
