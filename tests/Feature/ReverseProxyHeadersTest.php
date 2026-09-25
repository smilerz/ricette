<?php

declare(strict_types=1);

use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use function Pest\Laravel\withServerVariables;

beforeEach(function (): void {
    Route::get('/_proxy-probe', fn (Request $request) => response()->json([
        'secure' => $request->secure(),
        'host' => $request->getHost(),
        'ip' => $request->ip(),
    ]));
});

afterEach(function (): void {
    TrustProxies::flushState();
});

$forwarded = [
    'X-Forwarded-Proto' => 'https',
    'X-Forwarded-Host' => 'ricette.example',
    'X-Forwarded-For' => '203.0.113.7',
];

it('ignores forwarded headers from a peer that is not a trusted proxy', function () use ($forwarded): void {
    TrustProxies::at('10.0.0.0/8');

    withServerVariables(['REMOTE_ADDR' => '198.51.100.9'])
        ->getJson('/_proxy-probe', $forwarded)
        ->assertOk()
        ->assertJson(['secure' => false, 'ip' => '198.51.100.9'])
        ->assertJsonMissing(['host' => 'ricette.example']);
});

it('honors forwarded headers from a trusted proxy', function () use ($forwarded): void {
    TrustProxies::at('10.0.0.0/8');

    withServerVariables(['REMOTE_ADDR' => '10.1.2.3'])
        ->getJson('/_proxy-probe', $forwarded)
        ->assertOk()
        ->assertJson(['secure' => true, 'host' => 'ricette.example', 'ip' => '203.0.113.7']);
});

it('trusts no proxy by default', function () use ($forwarded): void {
    withServerVariables(['REMOTE_ADDR' => '10.1.2.3'])
        ->getJson('/_proxy-probe', $forwarded)
        ->assertOk()
        ->assertJson(['secure' => false, 'ip' => '10.1.2.3']);
});
