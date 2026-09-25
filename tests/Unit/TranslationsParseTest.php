<?php

declare(strict_types=1);

use App\Support\Translations;

covers(Translations::class);
mutates(Translations::class);

it('parses a flat catalog', function (): void {
    expect(Translations::parse('{"a":"A","b.one":"B"}', 'en.json'))->toBe(['a' => 'A', 'b.one' => 'B']);
});

it('skips values that are not strings', function (): void {
    expect(Translations::parse('{"a":"A","b":1,"c":null,"d":{"x":"y"}}', 'en.json'))->toBe(['a' => 'A']);
});

it('returns nothing for an empty object', function (): void {
    expect(Translations::parse('{}', 'en.json'))->toBe([]);
});

it('fails loudly on invalid JSON and names the source', function (): void {
    Translations::parse('{nope', 'de.json');
})->throws(RuntimeException::class, 'Invalid translation file [de.json].');

it('fails loudly when the catalog is not an object', function (): void {
    Translations::parse('"text"', 'de.json');
})->throws(RuntimeException::class, 'Translation file [de.json] must contain a JSON object.');
