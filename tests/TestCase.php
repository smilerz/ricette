<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // PHP tests must not depend on built frontend assets; Playwright covers the real bundle.
        $this->withoutVite();
    }
}
