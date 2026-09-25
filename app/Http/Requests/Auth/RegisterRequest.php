<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Support\EmailAddress;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class RegisterRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $email = $this->input('email');

        if (is_string($email)) {
            $this->merge(['email' => EmailAddress::normalize($email)]);
        }
    }

    /**
     * Whether an address is already registered is deliberately not validated here: the
     * unique index decides, and the response does not depend on it (see RegisterController).
     *
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'confirmed', Password::min(12)->max(255)],
        ];
    }

    /**
     * Messages are translation keys; the frontend translates them (ADR-0024).
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'validation.required',
            'name.max' => 'validation.max',
            'email.required' => 'validation.required',
            'email.email' => 'validation.email',
            'email.max' => 'validation.max',
            'password.required' => 'validation.required',
            'password.confirmed' => 'validation.confirmed',
        ];
    }
}
