<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\HouseholdRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $household_id
 * @property int $user_id
 * @property HouseholdRole $role
 * @property Household $household
 */
final class Membership extends Model
{
    protected $table = 'household_user';

    /** @var list<string> */
    protected $fillable = ['household_id', 'user_id', 'role'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['role' => HouseholdRole::class];
    }

    /**
     * @return BelongsTo<Household, $this>
     */
    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }
}
