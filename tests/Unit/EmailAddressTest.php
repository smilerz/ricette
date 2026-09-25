<?php

declare(strict_types=1);

use App\Support\EmailAddress;

covers(EmailAddress::class);

it('normalizes case and surrounding whitespace', function (string $input, string $expected): void {
    expect(EmailAddress::normalize($input))->toBe($expected);
})->with([
    ['Ana@Example.COM', 'ana@example.com'],
    ['  ana@example.com ', 'ana@example.com'],
    ['ANA@EXAMPLE.COM', 'ana@example.com'],
    ['ÉLODIE@Example.fr', 'élodie@example.fr'],
]);
