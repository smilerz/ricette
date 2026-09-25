<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class CreateHouseholdRequest extends FormRequest
{
    /**
     * Only a name is accepted. Any other field, such as a member list, is ignored.
     *
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return ['name' => ['required', 'string', 'max:255']];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'validation.required',
            'name.max' => 'validation.max',
        ];
    }
}
