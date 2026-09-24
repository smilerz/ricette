<?php

declare(strict_types=1);

namespace App\Support;

use JsonException;
use RuntimeException;

/**
 * Loads the flat `lang/{locale}.json` message catalogs (ADR-0024).
 */
final class Translations
{
    /**
     * Messages for a locale, layered over the fallback locale's messages.
     *
     * @return array<string, string>
     */
    public static function for(string $locale, string $fallback): array
    {
        return [...self::load($fallback), ...self::load($locale)];
    }

    /**
     * @return array<string, string>
     */
    private static function load(string $locale): array
    {
        if (preg_match('/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/', $locale) !== 1) {
            return [];
        }

        $path = lang_path($locale.'.json');

        if (! is_file($path)) {
            return [];
        }

        $contents = file_get_contents($path);

        if ($contents === false) {
            throw new RuntimeException("Unable to read translation file [{$path}].");
        }

        try {
            $decoded = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RuntimeException("Invalid translation file [{$path}].", previous: $exception);
        }

        if (! is_array($decoded)) {
            throw new RuntimeException("Translation file [{$path}] must contain a JSON object.");
        }

        $messages = [];

        foreach ($decoded as $key => $value) {
            if (is_string($value)) {
                $messages[(string) $key] = $value;
            }
        }

        return $messages;
    }
}
