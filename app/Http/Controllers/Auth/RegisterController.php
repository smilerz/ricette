<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class RegisterController
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Uniqueness of the normalized email is enforced by the database, so it holds even when
     * two registrations race. A duplicate creates nothing and gets exactly the response a new
     * account gets: the outcome is never signalled to the caller, which keeps this behavior
     * compatible with later account-existence non-disclosure.
     */
    public function store(RegisterRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        try {
            DB::transaction(static fn () => User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
            ]));
        } catch (UniqueConstraintViolationException) {
            // Deliberately the same response as a successful registration.
        }

        return to_route('login')->with('status', 'auth.registered');
    }
}
