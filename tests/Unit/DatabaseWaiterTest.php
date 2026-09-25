<?php

declare(strict_types=1);

use App\Support\DatabaseWaiter;

covers(DatabaseWaiter::class);

/**
 * A fake clock that only advances when the waiter sleeps.
 *
 * @return array{clock: Closure(): float, sleep: Closure(float): void, slept: Closure(): array<int, float>}
 */
function fakeTime(): array
{
    $now = 0.0;
    /** @var array<int, float> $slept */
    $slept = [];

    return [
        'clock' => function () use (&$now): float {
            return $now;
        },
        'sleep' => function (float $seconds) use (&$now, &$slept): void {
            $now += $seconds;
            $slept[] = $seconds;
        },
        'slept' => function () use (&$slept): array {
            return $slept;
        },
    ];
}

it('returns immediately when the database is already ready', function (): void {
    $time = fakeTime();

    $ready = DatabaseWaiter::wait(fn () => true, 30, $time['sleep'], $time['clock']);

    expect($ready)->toBeTrue()
        ->and($time['slept']())->toBe([]);
});

it('retries with exponential backoff capped at five seconds until the database is ready', function (): void {
    $time = fakeTime();
    $failures = 6;

    $ready = DatabaseWaiter::wait(function () use (&$failures): void {
        if ($failures-- > 0) {
            throw new RuntimeException('connection refused');
        }
    }, 60, $time['sleep'], $time['clock']);

    expect($ready)->toBeTrue()
        ->and($time['slept']())->toBe([1.0, 2.0, 4.0, 5.0, 5.0, 5.0]);
});

it('gives up once the timeout has passed', function (): void {
    $time = fakeTime();

    $ready = DatabaseWaiter::wait(fn () => throw new RuntimeException('down'), 10, $time['sleep'], $time['clock']);

    expect($ready)->toBeFalse()
        ->and(array_sum($time['slept']()))->toBe(10.0);
});

it('never sleeps past the deadline', function (): void {
    $time = fakeTime();

    DatabaseWaiter::wait(fn () => throw new RuntimeException('down'), 3.5, $time['sleep'], $time['clock']);

    expect($time['slept']())->toBe([1.0, 2.0, 0.5]);
});

it('reports each retry with the failure and the coming delay', function (): void {
    $time = fakeTime();
    $reports = [];

    DatabaseWaiter::wait(
        fn () => throw new RuntimeException('down'),
        2,
        $time['sleep'],
        $time['clock'],
        function (Throwable $failure, float $delay) use (&$reports): void {
            $reports[] = [$failure->getMessage(), $delay];
        },
    );

    expect($reports)->toBe([['down', 1.0], ['down', 1.0]]);
});

it('does not wait at all with a zero timeout', function (): void {
    $time = fakeTime();

    $ready = DatabaseWaiter::wait(fn () => throw new RuntimeException('down'), 0, $time['sleep'], $time['clock']);

    expect($ready)->toBeFalse()
        ->and($time['slept']())->toBe([]);
});
