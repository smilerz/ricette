<?php

declare(strict_types=1);

namespace App\Actions\Households;

use App\Enums\HouseholdRole;
use App\Models\Household;
use App\Models\Membership;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class CreateHousehold
{
    /**
     * Creates a household and its owner's membership in one transaction: either both exist or
     * neither does. Ownership lives only in the membership record. This deliberately does not
     * accept other members; admission needs a consent mechanism (issue #74).
     */
    public function __invoke(User $owner, string $name): Membership
    {
        return DB::transaction(static function () use ($owner, $name): Membership {
            $household = Household::create(['name' => $name]);

            $membership = Membership::create([
                'household_id' => $household->id,
                'user_id' => $owner->id,
                'role' => HouseholdRole::Owner,
            ]);

            return $membership->setRelation('household', $household);
        });
    }
}
