<script lang="ts">
    import type { FormComponentSlotProps } from '@inertiajs/core';
    import { Form, Link, usePage } from '@inertiajs/svelte';
    import TextField from '../../components/TextField.svelte';
    import { createTranslator } from '../../lib/i18n';

    const page = usePage();
    const i18n = $derived(createTranslator(page.props.translations, page.props.locale));
</script>

<svelte:head>
    <title>{i18n.t('auth.register.title')} - {i18n.t('app.name')}</title>
</svelte:head>

<main>
    <h1>{i18n.t('auth.register.title')}</h1>

    <Form action="/register" method="post" resetOnError={['password', 'password_confirmation']}>
        {#snippet children({ errors, processing }: FormComponentSlotProps)}
            <TextField
                name="name"
                autocomplete="name"
                label={i18n.t('auth.field.name')}
                error={errors.name ? i18n.t(errors.name) : undefined}
            />
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
                autocomplete="new-password"
                minlength={12}
                label={i18n.t('auth.field.password')}
                hint={i18n.t('auth.password_hint')}
                error={errors.password ? i18n.t(errors.password) : undefined}
            />
            <TextField
                name="password_confirmation"
                type="password"
                autocomplete="new-password"
                label={i18n.t('auth.field.password_confirmation')}
            />
            <button type="submit" disabled={processing}>{i18n.t('auth.register.submit')}</button>
        {/snippet}
    </Form>

    <p><Link href="/login">{i18n.t('auth.have_account')}</Link></p>
</main>
