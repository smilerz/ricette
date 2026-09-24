<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;

/**
 * Proves the database-backed queue executes a job end to end (Foundation 0 §65).
 * It carries no product behavior and is removed once real jobs exist.
 */
final class ScaffoldProbe implements ShouldQueue
{
    use Queueable;

    public const CACHE_KEY = 'scaffold.probe.ran';

    public function __construct(public readonly string $marker) {}

    public function handle(): void
    {
        Cache::put(self::CACHE_KEY, $this->marker);
    }
}
