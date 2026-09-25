<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Membership;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Selects the household a request acts within (RIC-CON-TENANT-SCOPE-SERVER-DERIVED-001).
 *
 * The active household is server-side state: an id kept in the session, or the user's only
 * membership. It is always checked against the authenticated user's own memberships, so a
 * household id supplied by the client (a parameter, a header, a forged session value) never
 * establishes scope on its own.
 */
final class ActiveHousehold
{
    public const SESSION_KEY = 'active_household_id';

    public static function membership(Request $request): ?Membership
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return null;
        }

        $selected = $request->session()->get(self::SESSION_KEY);

        if (is_int($selected)) {
            $membership = $user->memberships()->with('household')->where('household_id', $selected)->first();

            if ($membership !== null) {
                return $membership;
            }
        }

        $memberships = $user->memberships()->with('household')->limit(2)->get();

        return $memberships->count() === 1 ? $memberships->first() : null;
    }

    public static function activate(Request $request, Membership $membership): void
    {
        $request->session()->put(self::SESSION_KEY, $membership->household_id);
    }
}
