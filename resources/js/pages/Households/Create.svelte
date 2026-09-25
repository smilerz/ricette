<script lang="ts">
    import type { FormComponentSlotProps } from '@inertiajs/core';
    import { Form, Link, usePage } from '@inertiajs/svelte';
    import TextField from '../../components/TextField.svelte';
    import { createTranslator } from '../../lib/i18n';

    const page = usePage();
    const i18n = $derived(createTranslator(page.props.translations, page.props.locale));
</script>

<svelte:head>
    <title>{i18n.t('household.create.title')} - {i18n.t('app.name')}</title>
</svelte:head>

<main>
    <h1>{i18n.t('household.create.title')}</h1>

    <Form action="/households" method="post">
        {#snippet children({ errors, processing }: FormComponentSlotProps)}
            <TextField
                name="name"
                autocomplete="off"
                label={i18n.t('household.field.name')}
                error={errors.name ? i18n.t(errors.name) : undefined}
            />
            <button type="submit" disabled={processing}>{i18n.t('household.create.submit')}</button>
        {/snippet}
    </Form>

    <p><Link href="/">{i18n.t('app.name')}</Link></p>
</main>
