<?php

namespace App\Support;

use App\Models\Tenant;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;

/**
 * Resolves per-tenant SMTP / from-address settings.
 *
 * Usage (when ready to send tenant-branded mail):
 *
 *   TenantMailConfigurator::apply($tenant);
 *   Mail::to($user)->send(new WelcomeMail(...));
 *   TenantMailConfigurator::restore();
 *
 * If the tenant has no custom SMTP, the application default mailer is kept.
 */
final class TenantMailConfigurator
{
    /** @var array<string, mixed>|null */
    private static ?array $previousMailConfig = null;

    public static function apply(?Tenant $tenant): void
    {
        if ($tenant === null || ! $tenant->hasCustomSmtp()) {
            return;
        }

        self::$previousMailConfig = [
            'mail.default' => Config::get('mail.default'),
            'mail.mailers.smtp' => Config::get('mail.mailers.smtp'),
            'mail.from' => Config::get('mail.from'),
        ];

        Config::set('mail.default', 'smtp');
        Config::set('mail.mailers.smtp.transport', 'smtp');
        Config::set('mail.mailers.smtp.host', $tenant->mail_host);
        Config::set('mail.mailers.smtp.port', $tenant->mail_port ?? 587);
        Config::set('mail.mailers.smtp.username', $tenant->mail_username);
        Config::set('mail.mailers.smtp.password', $tenant->mail_password);
        Config::set('mail.mailers.smtp.encryption', $tenant->mail_encryption ?: null);

        if (filled($tenant->mail_from_address)) {
            Config::set('mail.from.address', $tenant->mail_from_address);
            Config::set('mail.from.name', $tenant->name);
        }

        // Purge cached mailer so the next send uses the new config.
        Mail::purge('smtp');
    }

    public static function restore(): void
    {
        if (self::$previousMailConfig === null) {
            return;
        }

        foreach (self::$previousMailConfig as $key => $value) {
            Config::set($key, $value);
        }

        Mail::purge('smtp');
        self::$previousMailConfig = null;
    }
}
