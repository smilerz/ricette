<?php

declare(strict_types=1);

use App\Support\TrustedProxies;
use Symfony\Component\HttpFoundation\Request;

covers(TrustedProxies::class);
mutates(TrustedProxies::class);

it('trusts no proxy when the setting is absent or blank', function (?string $value): void {
    expect(TrustedProxies::fromEnvironment($value))->toBeNull();
})->with([null, '', '   ', ',', ' , ,']);

it('parses a list of addresses and ranges', function (): void {
    expect(TrustedProxies::fromEnvironment('10.0.0.1, 172.16.0.0/12 ,,192.168.1.5'))
        ->toBe(['10.0.0.1', '172.16.0.0/12', '192.168.1.5']);
});

it('accepts a single address', function (): void {
    expect(TrustedProxies::fromEnvironment('127.0.0.1'))->toBe(['127.0.0.1']);
});

it('accepts the explicit wildcard', function (): void {
    expect(TrustedProxies::fromEnvironment(' * '))->toBe('*');
});

it('honors only the standard forwarded headers', function (): void {
    expect(TrustedProxies::HEADERS)->toBe(
        Request::HEADER_X_FORWARDED_FOR
        | Request::HEADER_X_FORWARDED_HOST
        | Request::HEADER_X_FORWARDED_PORT
        | Request::HEADER_X_FORWARDED_PROTO,
    );
});
