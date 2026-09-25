<?php

declare(strict_types=1);

use App\Enums\HouseholdRole;
use App\Models\Household;
use App\Models\Membership;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\get;
use function Pest\Laravel\post;
use function Pest\Laravel\withoutExceptionHandling;

it('sends guests to sign in', function (): void {
    get('/households/create')->assertRedirect('/login');
    post('/households', ['name' => 'Home'])->assertRedirect('/login');

    assertDatabaseCount('households', 0);
});

it('shows the creation page to a signed-in user', function (): void {
    actingAs(User::factory()->create());

    get('/households/create')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Households/Create'));
});

it('creates a household and makes the creator its owner', function (): void {
    $user = User::factory()->create();
    actingAs($user);

    post('/households', ['name' => 'The Ana household'])->assertRedirect('/');

    $household = Household::query()->firstOrFail();
    $membership = Membership::query()->firstOrFail();

    expect($household->name)->toBe('The Ana household')
        ->and($membership->household_id)->toBe($household->id)
        ->and($membership->user_id)->toBe($user->id)
        ->and($membership->role)->toBe(HouseholdRole::Owner);
    assertDatabaseCount('households', 1);
    assertDatabaseCount('household_user', 1);
});

it('keeps ownership only in the membership record', function (): void {
    expect(Schema::hasColumn('households', 'owner_id'))->toBeFalse();
});

it('creates the household and the owner membership atomically', function (): void {
    actingAs(User::factory()->create());
    withoutExceptionHandling();
    Membership::creating(static function (): never {
        throw new RuntimeException('membership could not be written');
    });

    expect(fn () => post('/households', ['name' => 'Home']))->toThrow(RuntimeException::class);

    assertDatabaseCount('households', 0);
    assertDatabaseCount('household_user', 0);
});

it('rejects an invalid name with translation keys', function (string $name, string $key): void {
    actingAs(User::factory()->create());

    post('/households', ['name' => $name])->assertSessionHasErrors(['name' => $key]);

    assertDatabaseCount('households', 0);
})->with([
    'missing' => ['', 'validation.required'],
    'too long' => [str_repeat('a', 256), 'validation.max'],
]);

it('accepts no way to add other members', function (): void {
    $creator = User::factory()->create();
    $other = User::factory()->create();
    actingAs($creator);

    post('/households', ['name' => 'Home', 'members' => [$other->id], 'member_ids' => [$other->id], 'user_id' => $other->id])
        ->assertRedirect('/');

    assertDatabaseCount('household_user', 1);
    expect(Membership::query()->where('user_id', $other->id)->exists())->toBeFalse();
});

it('lets one person belong to several households', function (): void {
    $user = User::factory()->create();
    actingAs($user);

    post('/households', ['name' => 'Family']);
    post('/households', ['name' => 'Flat']);

    expect($user->memberships()->count())->toBe(2)
        ->and(Household::query()->count())->toBe(2);
});

it('persists the household and membership in the database', function (): void {
    $user = User::factory()->create();
    actingAs($user);
    post('/households', ['name' => 'Home']);

    expect(DB::table('households')->where('name', 'Home')->exists())->toBeTrue()
        ->and(DB::table('household_user')->where('user_id', $user->id)->where('role', 'owner')->exists())->toBeTrue();
});
