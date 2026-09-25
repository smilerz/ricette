<?php

declare(strict_types=1);

namespace App\Support;

use Symfony\Component\HttpFoundation\Request;

/**
 * Reads the `TRUSTED_PROXIES` setting (Foundation 0, RIC-REQ-REVERSE-PROXY-HEADERS-001).
 */
final class TrustedProxies
{
    /** Forwarded headers the application honors, and only from a trusted proxy. */
    public const HEADERS = Request::HEADER_X_FORWARDED_FOR
        | Request::HEADER_X_FORWARDED_HOST
        | Request::HEADER_X_FORWARDED_PORT
        | Request::HEADER_X_FORWARDED_PROTO;

    /**
     * A comma-separated list of proxy IP addresses or CIDR ranges, `*` to trust the
     * immediate peer (only safe when the container is reachable solely through the
     * proxy), or nothing to trust no proxy.
     *
     * @return array<int, string>|string|null
     */
    public static function fromEnvironment(?string $value): array|string|null
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);

        if ($value === '') {
            return null;
        }

        if ($value === '*') {
            return '*';
        }

        $proxies = array_values(array_filter(
            array_map('trim', explode(',', $value)),
            static fn (string $proxy): bool => $proxy !== '',
        ));

        return $proxies === [] ? null : $proxies;
    }
}
