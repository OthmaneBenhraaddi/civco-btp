<?php

namespace App\Support;

final class StealthModeManager
{
    private static bool $active = false;

    public static function enable(): void
    {
        self::$active = true;
    }

    public static function disable(): void
    {
        self::$active = false;
    }

    public static function setActive(bool $active): void
    {
        self::$active = $active;
    }

    public static function isActive(): bool
    {
        return self::$active;
    }

    public static function shouldHideUnofficial(): bool
    {
        return self::$active;
    }
}
