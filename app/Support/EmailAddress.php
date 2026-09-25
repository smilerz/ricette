<?php

declare(strict_types=1);

namespace App\Support;

/**
 * The single definition of email identity: two addresses that differ only in
 * case or surrounding whitespace are the same account (RIC-CON-AUTH-EMAIL-CASE-INSENSITIVE-001).
 */
final class EmailAddress
{
    public static function normalize(string $email): string
    {
        return mb_strtolower(trim($email));
    }
}
