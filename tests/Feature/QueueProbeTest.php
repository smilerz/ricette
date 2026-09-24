<?php

declare(strict_types=1);

use App\Jobs\ScaffoldProbe;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

it('runs a queued job through the database queue', function (): void {
    config(['queue.default' => 'database']);

    ScaffoldProbe::dispatch('run-1');

    expect(DB::table('jobs')->count())->toBe(1)
        ->and(Cache::has(ScaffoldProbe::CACHE_KEY))->toBeFalse();

    Artisan::call('queue:work', ['--stop-when-empty' => true, '--quiet' => true]);

    expect(Cache::get(ScaffoldProbe::CACHE_KEY))->toBe('run-1')
        ->and(DB::table('jobs')->count())->toBe(0);
});
