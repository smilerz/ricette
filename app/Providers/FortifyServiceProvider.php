<?php

declare(strict_types=1);

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Models\User;
use App\Support\EmailAddress;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Fortify;

final class FortifyServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Fortify::createUsersUsing(CreateNewUser::class);
        Fortify::loginView(fn () => Inertia::render('Auth/Login'));
        Fortify::registerView(fn () => Inertia::render('Auth/Register'));

        // Email identity is case-insensitive (RIC-CON-AUTH-EMAIL-CASE-INSENSITIVE-001).
        Fortify::authenticateUsing(static function (Request $request): ?User {
            $email = $request->input('email');
            $password = $request->input('password');

            if (! is_string($email) || ! is_string($password)) {
                return null;
            }

            $user = User::query()->where('email', EmailAddress::normalize($email))->first();

            return $user instanceof User && Hash::check($password, $user->password) ? $user : null;
        });

        RateLimiter::for('login', static function (Request $request): Limit {
            $email = $request->input('email');
            $key = Str::transliterate(EmailAddress::normalize(is_string($email) ? $email : '').'|'.$request->ip());

            return Limit::perMinute(5)->by($key);
        });
    }
}
