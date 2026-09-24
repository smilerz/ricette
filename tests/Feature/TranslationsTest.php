<?php

declare(strict_types=1);

use App\Support\Translations;

covers(Translations::class);

/**
 * @param  array<string, string>  $files
 */
function useCatalogs(array $files): void
{
    $directory = sys_get_temp_dir().'/ricette-lang-'.bin2hex(random_bytes(4));
    mkdir($directory);

    foreach ($files as $name => $contents) {
        file_put_contents($directory.'/'.$name, $contents);
    }

    app()->useLangPath($directory);
}

it('layers the locale over the fallback locale', function (): void {
    useCatalogs([
        'en.json' => '{"a":"A","b":"B"}',
        'de.json' => '{"b":"Bee"}',
    ]);

    expect(Translations::for('de', 'en'))->toBe(['a' => 'A', 'b' => 'Bee']);
});

it('returns nothing for a missing catalog', function (): void {
    useCatalogs([]);

    expect(Translations::for('fr', 'en'))->toBe([]);
});

it('refuses a locale name that is not a plain language tag', function (): void {
    useCatalogs(['en.json' => '{"a":"A"}']);

    expect(Translations::for('../en', '../en'))->toBe([]);
});

it('fails loudly on an invalid catalog file', function (): void {
    useCatalogs(['en.json' => '{nope']);

    Translations::for('en', 'en');
})->throws(RuntimeException::class, 'Invalid translation file');
