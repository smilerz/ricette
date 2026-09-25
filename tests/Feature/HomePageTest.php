<?php

declare(strict_types=1);

use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\get;

it('renders the home page through Inertia', function (): void {
    get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Home')
            ->where('locale', 'en')
            ->where('fallbackLocale', 'en')
            ->where('translations', fn ($translations) => $translations instanceof Collection && $translations->get('home.title') === 'Welcome to Ricette'));
});

it('serves the framework health endpoint', function (): void {
    get('/up')->assertOk();
});
