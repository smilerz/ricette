<?php

declare(strict_types=1);

namespace App\Actions\Fortify;

use App\Models\User;
use App\Support\EmailAddress;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

final class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validates and creates a user. The email is normalized first, so addresses differing only
     * in case or whitespace are one account. Uniqueness is decided by the database's unique
     * index: the validation rule gives a friendly error in the common case, and a registration
     * that loses a race hits the index and gets the same error instead of a server error.
     *
     * @param  array<string, mixed>  $input
     *
     * @throws ValidationException
     */
    public function create(array $input): User
    {
        if (isset($input['email']) && is_string($input['email'])) {
            $input['email'] = EmailAddress::normalize($input['email']);
        }

        $validated = Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'password' => $this->passwordRules(),
        ], [
            'name.required' => 'validation.required',
            'name.max' => 'validation.max',
            'email.required' => 'validation.required',
            'email.email' => 'validation.email',
            'email.max' => 'validation.max',
            'email.unique' => 'validation.unique',
            'password.required' => 'validation.required',
            'password.confirmed' => 'validation.confirmed',
        ])->validate();

        try {
            return DB::transaction(static fn (): User => User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
            ]));
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['email' => 'validation.unique']);
        }
    }
}
