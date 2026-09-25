<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Actions\Households\CreateHousehold;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

/**
 * A demo account and household for looking at the running app during development.
 * Never runs in production: the credentials are public.
 */
final class DemoSeeder extends Seeder
{
    public const EMAIL = 'demo@example.com';

    public const PASSWORD = 'correct horse battery staple';

    public function run(CreateHousehold $createHousehold): void
    {
        if (app()->isProduction()) {
            throw new RuntimeException('The demo seeder must not run in production.');
        }

        $user = User::query()->where('email', self::EMAIL)->first();

        if ($user !== null) {
            return;
        }

        $user = User::create(['name' => 'Demo', 'email' => self::EMAIL, 'password' => self::PASSWORD]);
        $createHousehold($user, 'Demo household');
    }
}
