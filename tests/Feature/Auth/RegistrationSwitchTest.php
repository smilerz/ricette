<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Fortify reads its feature list when the application boots, so each case sets the environment first and
 * then starts a fresh application.
 */
final class RegistrationSwitchTest extends TestCase
{
    protected function tearDown(): void
    {
        $this->setRegistration(null);

        parent::tearDown();
    }

    private function setRegistration(?string $value): void
    {
        if ($value === null) {
            putenv('REGISTRATION_ENABLED');
            unset($_ENV['REGISTRATION_ENABLED'], $_SERVER['REGISTRATION_ENABLED']);
        } else {
            putenv('REGISTRATION_ENABLED='.$value);
            $_ENV['REGISTRATION_ENABLED'] = $_SERVER['REGISTRATION_ENABLED'] = $value;
        }

        $this->refreshApplication();
        $this->withoutVite();
    }

    public function test_registration_is_open_by_default(): void
    {
        $this->setRegistration(null);

        $this->get('/register')->assertOk();
        $this->get('/login')->assertInertia(fn (Assert $page) => $page->where('registrationOpen', true));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function closedValues(): array
    {
        return [
            'false' => ['false'],
            'zero' => ['0'],
            'no' => ['no'],
            'off' => ['off'],
            'empty' => [''],
            'misspelled' => ['closed'],
        ];
    }

    #[DataProvider('closedValues')]
    public function test_registration_is_closed_by_a_false_or_unrecognised_value(string $value): void
    {
        $this->setRegistration($value);

        $this->get('/register')->assertNotFound();
        $this->post('/register', [
            'name' => 'Ana',
            'email' => 'ana@example.com',
            'password' => 'correct horse battery staple',
            'password_confirmation' => 'correct horse battery staple',
        ])->assertNotFound();
        $this->get('/login')->assertOk()->assertInertia(fn (Assert $page) => $page->where('registrationOpen', false));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function openValues(): array
    {
        return ['true' => ['true'], 'one' => ['1'], 'yes' => ['yes'], 'on' => ['on']];
    }

    #[DataProvider('openValues')]
    public function test_registration_stays_open_with_a_true_value(string $value): void
    {
        $this->setRegistration($value);

        $this->get('/register')->assertOk();
    }
}
