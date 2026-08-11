<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            if (! Schema::hasColumn('tenants', 'custom_domain')) {
                $table->string('custom_domain', 255)->nullable()->unique()->after('subdomain');
            }
            if (! Schema::hasColumn('tenants', 'mail_from_address')) {
                $table->string('mail_from_address', 150)->nullable()->after('logo_path');
            }
            if (! Schema::hasColumn('tenants', 'mail_host')) {
                $table->string('mail_host', 255)->nullable()->after('mail_from_address');
            }
            if (! Schema::hasColumn('tenants', 'mail_port')) {
                $table->unsignedSmallInteger('mail_port')->nullable()->after('mail_host');
            }
            if (! Schema::hasColumn('tenants', 'mail_username')) {
                $table->string('mail_username', 150)->nullable()->after('mail_port');
            }
            if (! Schema::hasColumn('tenants', 'mail_password')) {
                $table->text('mail_password')->nullable()->after('mail_username');
            }
            if (! Schema::hasColumn('tenants', 'mail_encryption')) {
                $table->string('mail_encryption', 10)->nullable()->after('mail_password');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            foreach ([
                'custom_domain',
                'mail_from_address',
                'mail_host',
                'mail_port',
                'mail_username',
                'mail_password',
                'mail_encryption',
            ] as $column) {
                if (Schema::hasColumn('tenants', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
