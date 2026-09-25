<script lang="ts">
    import type { HTMLInputAttributes } from 'svelte/elements';

    interface Props {
        name: string;
        label: string;
        type?: 'text' | 'email' | 'password';
        autocomplete?: HTMLInputAttributes['autocomplete'];
        minlength?: number;
        hint?: string;
        error?: string | undefined;
    }

    let { name, label, type = 'text', autocomplete, minlength, hint, error }: Props = $props();

    const describedBy = $derived(
        [hint ? `${name}-hint` : null, error ? `${name}-error` : null].filter(Boolean).join(' ') ||
            undefined,
    );
</script>

<p>
    <label for={name}>{label}</label><br />
    <input
        id={name}
        {name}
        {type}
        {autocomplete}
        {minlength}
        required
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
    />
    {#if hint}
        <span id="{name}-hint">{hint}</span>
    {/if}
    {#if error}
        <span id="{name}-error" role="alert">{error}</span>
    {/if}
</p>
