<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\Translations;
use Illuminate\Http\Request;
use Inertia\Middleware;

final class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    /**
     * Props shared with every Inertia page.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $locale = app()->getLocale();
        $fallback = config()->string('app.fallback_locale');

        $user = $request->user();
        $status = $request->session()->get('status');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user instanceof User
                    ? ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]
                    : null,
            ],
            'status' => is_string($status) ? $status : null,
            'locale' => $locale,
            'fallbackLocale' => $fallback,
            'translations' => Translations::for($locale, $fallback),
        ];
    }
}
