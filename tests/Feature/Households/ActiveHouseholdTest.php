<?php

declare(strict_types=1);

use App\Enums\HouseholdRole;
use App\Models\Household;
use App\Models\Membership;
use App\Models\User;
use App\Support\ActiveHousehold;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\post;
use function Pest\Laravel\withSession;

function join_household(User $user, Household $household, HouseholdRole $role = HouseholdRole::Member): Membership
{
    return Membership::create(['household_id' => $household->id, 'user_id' => $user->id, 'role' => $role]);
}

it('shares no household with a user who has none', function (): void {
    actingAs(User::factory()->create());

    get('/')->assertInertia(fn (Assert $page) => $page->where('household', null));
});

it('uses the only household a user belongs to', function (): void {
    $user = User::factory()->create();
    $household = Household::factory()->create(['name' => 'Home']);
    join_household($user, $household, HouseholdRole::Owner);
    actingAs($user);

    get('/')->assertInertia(fn (Assert $page) => $page
        ->where('household.id', $household->id)
        ->where('household.name', 'Home')
        ->where('household.role', 'owner'));
});

it('selects the household the server put in the session when the user is a member', function (): void {
    $user = User::factory()->create();
    $first = Household::factory()->create(['name' => 'First']);
    $second = Household::factory()->create(['name' => 'Second']);
    join_household($user, $first, HouseholdRole::Owner);
    join_household($user, $second);
    actingAs($user);

    withSession([ActiveHousehold::SESSION_KEY => $second->id])
        ->get('/')
        ->assertInertia(fn (Assert $page) => $page->where('household.name', 'Second')->where('household.role', 'member'));
});

it('does not guess when a user has several households and none is selected', function (): void {
    $user = User::factory()->create();
    join_household($user, Household::factory()->create());
    join_household($user, Household::factory()->create());
    actingAs($user);

    get('/')->assertInertia(fn (Assert $page) => $page->where('household', null));
});

it('ignores a session household the user does not belong to', function (): void {
    $user = User::factory()->create();
    $mine = Household::factory()->create(['name' => 'Mine']);
    $theirs = Household::factory()->create(['name' => 'Theirs']);
    join_household($user, $mine, HouseholdRole::Owner);
    actingAs($user);

    withSession([ActiveHousehold::SESSION_KEY => $theirs->id])
        ->get('/')
        ->assertInertia(fn (Assert $page) => $page->where('household.name', 'Mine'));
});

it('grants nothing for a foreign household id when the user has no membership at all', function (): void {
    $user = User::factory()->create();
    $theirs = Household::factory()->create();
    actingAs($user);

    withSession([ActiveHousehold::SESSION_KEY => $theirs->id])
        ->get('/')
        ->assertInertia(fn (Assert $page) => $page->where('household', null));
});

it('never lets a client-supplied household id select the household', function (): void {
    $user = User::factory()->create();
    $mine = Household::factory()->create(['name' => 'Mine']);
    $theirs = Household::factory()->create(['name' => 'Theirs']);
    join_household($user, $mine, HouseholdRole::Owner);
    join_household($user, $theirs);
    actingAs($user);

    get('/?household_id='.$theirs->id, ['X-Household-Id' => (string) $theirs->id])
        ->assertInertia(fn (Assert $page) => $page->where('household', null));
});

it('activates the household a person just created', function (): void {
    $user = User::factory()->create();
    join_household($user, Household::factory()->create(['name' => 'Old']));
    actingAs($user);

    post('/households', ['name' => 'New']);

    get('/')->assertInertia(fn (Assert $page) => $page->where('household.name', 'New')->where('household.role', 'owner'));
});

it('does not resolve a household for a guest', function (): void {
    get('/')->assertInertia(fn (Assert $page) => $page->where('household', null));
});
