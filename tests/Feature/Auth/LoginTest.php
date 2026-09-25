<?php

declare(strict_types=1);

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertAuthenticatedAs;
use function Pest\Laravel\assertGuest;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

function ana(): User
{
    return User::factory()->create([
        'email' => 'ana@example.com',
        'password' => 'correct horse battery staple',
    ]);
}

it('shows the sign-in page to guests', function (): void {
    get('/login')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Auth/Login'));
});

it('signs in with the right credentials', function (): void {
    $user = ana();

    post('/login', ['email' => 'ana@example.com', 'password' => 'correct horse battery staple'])
        ->assertRedirect('/');

    assertAuthenticatedAs($user);
});

it('matches the email regardless of case and whitespace', function (string $typed): void {
    $user = ana();

    post('/login', ['email' => $typed, 'password' => 'correct horse battery staple'])
        ->assertRedirect('/');

    assertAuthenticatedAs($user);
})->with(['ANA@EXAMPLE.COM', 'Ana@Example.com', '  ana@example.com  ']);

it('refuses a wrong password with the same error as an unknown account', function (): void {
    ana();

    post('/login', ['email' => 'ana@example.com', 'password' => 'wrong password here'])
        ->assertSessionHasErrors(['email' => 'auth.failed']);
    assertGuest();

    post('/login', ['email' => 'nobody@example.com', 'password' => 'wrong password here'])
        ->assertSessionHasErrors(['email' => 'auth.failed']);
    assertGuest();
});

it('requires both fields', function (): void {
    post('/login', ['email' => '', 'password' => ''])
        ->assertSessionHasErrors(['email', 'password']);
});

it('renews the session on sign-in', function (): void {
    ana();

    $before = session()->getId();

    post('/login', ['email' => 'ana@example.com', 'password' => 'correct horse battery staple']);

    expect(session()->getId())->not->toBe($before);
});

it('redirects a signed-in user away from the sign-in page', function (): void {
    actingAs(ana());

    get('/login')->assertRedirect('/');
});

it('shares the signed-in user with the page and nothing else about them', function (): void {
    $user = ana();
    actingAs($user);

    get('/')->assertInertia(fn (Assert $page) => $page
        ->where('auth.user.email', 'ana@example.com')
        ->where('auth.user.name', $user->name)
        ->missing('auth.user.password'));
});

it('shares no user for a guest', function (): void {
    get('/')->assertInertia(fn (Assert $page) => $page->where('auth.user', null));
});

it('signs out and ends the session', function (): void {
    actingAs(ana());

    post('/logout')->assertRedirect('/');

    assertGuest();
});

it('does not let a guest reach sign-out', function (): void {
    post('/logout')->assertRedirect('/login');
});
