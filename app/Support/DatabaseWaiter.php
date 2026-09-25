<?php

declare(strict_types=1);

namespace App\Support;

use Throwable;

/**
 * Retries a readiness probe with exponential backoff (1s, 2s, 4s, then 5s) so a
 * database that starts after the application does not crash the boot.
 */
final class DatabaseWaiter
{
    private const MAX_DELAY_SECONDS = 5.0;

    /**
     * @param  callable(): mixed  $probe  throws while the database is not ready
     * @param  callable(float): void  $sleep  waits for the given number of seconds
     * @param  callable(): float  $clock  monotonic time in seconds
     * @param  callable(Throwable, float): void|null  $onRetry  called with the failure and the coming delay
     */
    public static function wait(callable $probe, float $timeoutSeconds, callable $sleep, callable $clock, ?callable $onRetry = null): bool
    {
        $deadline = $clock() + $timeoutSeconds;
        $delay = 1.0;

        while (true) {
            try {
                $probe();

                return true;
            } catch (Throwable $failure) {
                $remaining = $deadline - $clock();

                if ($remaining <= 0) {
                    return false;
                }

                $pause = min($delay, $remaining);

                if ($onRetry !== null) {
                    $onRetry($failure, $pause);
                }

                $sleep($pause);
                $delay = min($delay * 2, self::MAX_DELAY_SECONDS);
            }
        }
    }
}
