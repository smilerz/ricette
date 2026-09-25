<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Registration, sign-in and sign-out routes are provided by Laravel Fortify (config/fortify.php).
Route::get('/', fn () => Inertia::render('Home'))->name('home');
