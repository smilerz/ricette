<?php

declare(strict_types=1);

use App\Http\Controllers\HouseholdController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Registration, sign-in and sign-out routes are provided by Laravel Fortify (config/fortify.php).
Route::get('/', fn () => Inertia::render('Home'))->name('home');

Route::middleware('auth')->group(function (): void {
    Route::get('/households/create', [HouseholdController::class, 'create'])->name('households.create');
    Route::post('/households', [HouseholdController::class, 'store'])->name('households.store');
});
