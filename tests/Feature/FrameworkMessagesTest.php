<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Validator;

/**
 * @return array<string, string>
 */
function catalog(): array
{
    /** @var array<string, string> $catalog */
    $catalog = json_decode((string) file_get_contents(lang_path('en.json')), true, flags: JSON_THROW_ON_ERROR);

    return $catalog;
}

// Laravel consults JSON catalogs before its own language files, so a catalog key named like a framework
// message (auth.failed, validation.required) replaces the framework's English text (ADR-0024).
it('resolves framework authentication messages from the catalog', function (string $key): void {
    expect(trans($key))->toBe(catalog()[$key]);
})->with(['auth.failed', 'auth.password', 'auth.throttle']);

it('resolves framework validation messages from the catalog', function (): void {
    $errors = Validator::make(
        ['email' => 'nope', 'name' => str_repeat('a', 300), 'code' => '', 'copy' => 'x', 'copy_confirmation' => 'y'],
        ['email' => 'email', 'name' => 'max:255', 'code' => 'required', 'copy' => 'confirmed'],
    )->errors();

    expect($errors->first('email'))->toBe(catalog()['validation.email'])
        ->and($errors->first('name'))->toBe(catalog()['validation.max.string'])
        ->and($errors->first('code'))->toBe(catalog()['validation.required'])
        ->and($errors->first('copy'))->toBe(catalog()['validation.confirmed']);
});
