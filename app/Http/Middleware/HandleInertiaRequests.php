<?php

declare(strict_types=1);

namespace App\Http\Middleware;

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

        return [
            ...parent::share($request),
            'locale' => $locale,
            'fallbackLocale' => $fallback,
            'translations' => Translations::for($locale, $fallback),
        ];
    }
}
