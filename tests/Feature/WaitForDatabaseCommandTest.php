<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Artisan;

it('succeeds when the database accepts connections', function (): void {
    $exitCode = Artisan::call('app:wait-for-database', ['--timeout' => 5]);

    expect($exitCode)->toBe(0)
        ->and(Artisan::output())->toContain('Database is ready.');
});

it('fails once the timeout passes without a reachable database', function (): void {
    config([
        'database.connections.unreachable' => [
            'driver' => 'pgsql',
            'host' => '127.0.0.1',
            'port' => 1,
            'database' => 'ricette',
            'username' => 'ricette',
            'password' => '',
        ],
    ]);

    $exitCode = Artisan::call('app:wait-for-database', ['--timeout' => 1, '--connection' => 'unreachable']);

    expect($exitCode)->toBe(1)
        ->and(Artisan::output())->toContain('did not become ready within 1 seconds');
});

it('reads the default timeout from configuration', function (): void {
    config(['database.wait_timeout' => 3]);

    expect(Artisan::call('app:wait-for-database'))->toBe(0);
});
