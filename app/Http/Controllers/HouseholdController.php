<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Households\CreateHousehold;
use App\Http\Requests\CreateHouseholdRequest;
use App\Models\User;
use App\Support\ActiveHousehold;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class HouseholdController
{
    public function create(): Response
    {
        return Inertia::render('Households/Create');
    }

    public function store(CreateHouseholdRequest $request, CreateHousehold $createHousehold): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $membership = $createHousehold($user, $request->string('name')->toString());

        ActiveHousehold::activate($request, $membership);

        return to_route('home');
    }
}
