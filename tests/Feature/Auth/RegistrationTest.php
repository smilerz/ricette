<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertAuthenticated;
use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

/**
 * @return array<string, string>
 */
function registration(string $email = 'ana@example.com'): array
{
    return [
        'name' => 'Ana',
        'email' => $email,
        'password' => 'correct horse battery staple',
        'password_confirmation' => 'correct horse battery staple',
    ];
}

it('shows the registration page to guests', function (): void {
    get('/register')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Auth/Register'));
});

it('creates an account and signs the person in', function (): void {
    post('/register', registration())->assertRedirect('/');

    assertDatabaseHas('users', ['email' => 'ana@example.com', 'name' => 'Ana']);
    assertAuthenticated();
});

it('stores the password only as an Argon2id hash', function (): void {
    post('/register', registration());

    $user = User::query()->where('email', 'ana@example.com')->firstOrFail();

    expect($user->password)->toStartWith('$argon2id$')
        ->and($user->password)->not->toContain('correct horse')
        ->and(Hash::check('correct horse battery staple', $user->password))->toBeTrue()
        ->and(config('hashing.driver'))->toBe('argon2id');
});

it('stores the email in normalized form', function (): void {
    post('/register', registration('  Ana@Example.COM '));

    assertDatabaseHas('users', ['email' => 'ana@example.com']);
});

it('rejects invalid registrations with translation keys', function (array $overrides, string $field, string $key): void {
    post('/register', [...registration(), ...$overrides])
        ->assertSessionHasErrors([$field => $key]);

    assertDatabaseCount('users', 0);
})->with([
    'missing name' => [['name' => ''], 'name', 'validation.required'],
    'long name' => [['name' => str_repeat('a', 256)], 'name', 'validation.max'],
    'missing email' => [['email' => ''], 'email', 'validation.required'],
    'invalid email' => [['email' => 'not-an-email'], 'email', 'validation.email'],
    'mismatched confirmation' => [['password_confirmation' => 'different different'], 'password', 'validation.confirmed'],
]);

it('requires a password of at least twelve characters', function (): void {
    post('/register', [...registration(), 'password' => 'short', 'password_confirmation' => 'short'])
        ->assertSessionHasErrors('password');

    assertDatabaseCount('users', 0);
});

it('redirects a signed-in user away from registration', function (): void {
    actingAs(User::factory()->create());

    get('/register')->assertRedirect('/');
});

describe('unique account identity under duplicate and concurrent registration', function (): void {
    it('refuses an existing email and creates nothing', function (): void {
        post('/register', registration());
        post('/logout');

        post('/register', registration())->assertSessionHasErrors(['email' => 'validation.unique']);

        assertDatabaseCount('users', 1);
    });

    it('treats addresses that differ only in case as the same account', function (): void {
        post('/register', registration('ana@example.com'));
        post('/logout');

        post('/register', registration('ANA@Example.com'))->assertSessionHasErrors(['email' => 'validation.unique']);

        assertDatabaseCount('users', 1);
    });

    it('does not overwrite the existing account', function (): void {
        post('/register', registration());
        post('/logout');
        $original = User::query()->firstOrFail()->password;

        post('/register', [...registration(), 'name' => 'Intruder', 'password' => 'another long password!', 'password_confirmation' => 'another long password!']);

        $user = User::query()->firstOrFail();
        expect($user->name)->toBe('Ana')
            ->and($user->password)->toBe($original);
    });

    it('is enforced by the database, not by a check that a race can slip past', function (): void {
        User::factory()->create(['email' => 'ana@example.com']);

        expect(fn () => DB::table('users')->insert([
            'name' => 'Dup',
            'email' => 'ana@example.com',
            'password' => 'x',
        ]))->toThrow(UniqueConstraintViolationException::class);
    });

    it('gives the same error, not a server error, when the insert loses a race', function (): void {
        User::creating(static function (): never {
            throw new UniqueConstraintViolationException('sqlite', 'insert into "users"', [], new PDOException('UNIQUE constraint failed'));
        });

        post('/register', registration())->assertSessionHasErrors(['email' => 'validation.unique']);

        assertDatabaseCount('users', 0);
    });
});
