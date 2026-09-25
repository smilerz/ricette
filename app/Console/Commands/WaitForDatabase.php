<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\DatabaseWaiter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

final class WaitForDatabase extends Command
{
    protected $signature = 'app:wait-for-database {--timeout= : Seconds to wait (default: DB_WAIT_TIMEOUT)} {--connection= : Database connection (default: the default connection)}';

    protected $description = 'Wait, retrying with backoff, until the database accepts connections';

    public function handle(): int
    {
        $option = $this->option('timeout');
        $connection = $this->option('connection');
        $timeout = is_numeric($option) ? (float) $option : config()->integer('database.wait_timeout');

        $ready = DatabaseWaiter::wait(
            probe: fn () => DB::connection(is_string($connection) && $connection !== '' ? $connection : null)->getPdo(),
            timeoutSeconds: $timeout,
            sleep: fn (float $seconds) => usleep((int) ($seconds * 1_000_000)),
            clock: fn (): float => microtime(true),
            onRetry: fn (Throwable $failure, float $delay) => $this->components->warn(
                'Database not ready ('.$failure->getMessage().'); retrying in '.$delay.'s',
            ),
        );

        if (! $ready) {
            $this->components->error('Database did not become ready within '.$timeout.' seconds.');

            return self::FAILURE;
        }

        $this->components->info('Database is ready.');

        return self::SUCCESS;
    }
}
