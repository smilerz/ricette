<?php

declare(strict_types=1);

use App\Actions\Households\CreateHousehold;
use App\Enums\HouseholdRole;
use App\Models\Household;
use App\Models\Membership;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Support\Facades\Hash;

use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\seed;

it('creates a demo account that owns a demo household', function (): void {
    seed(DemoSeeder::class);

    $user = User::query()->where('email', DemoSeeder::EMAIL)->firstOrFail();
    $membership = Membership::query()->where('user_id', $user->id)->firstOrFail();

    expect(Hash::check(DemoSeeder::PASSWORD, $user->password))->toBeTrue()
        ->and($membership->role)->toBe(HouseholdRole::Owner)
        ->and(Household::query()->findOrFail($membership->household_id)->name)->toBe('Demo household');
});

it('can run again without creating a second demo account', function (): void {
    seed(DemoSeeder::class);
    seed(DemoSeeder::class);

    assertDatabaseCount('users', 1);
    assertDatabaseCount('households', 1);
});

it('refuses to run in production because the credentials are public', function (): void {
    app()->detectEnvironment(static fn (): string => 'production');

    app(DemoSeeder::class)->run(app(CreateHousehold::class));
})->throws(RuntimeException::class, 'must not run in production');
