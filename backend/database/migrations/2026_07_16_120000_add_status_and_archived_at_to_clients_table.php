<?php

use App\Enums\ClientStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table): void {
            $table->string('status', 20)->default(ClientStatus::Active->value)->after('is_active');
            $table->timestamp('archived_at')->nullable()->after('status');
        });

        DB::table('clients')->orderBy('id')->chunkById(100, function ($clients): void {
            foreach ($clients as $client) {
                DB::table('clients')->where('id', $client->id)->update([
                    'status' => $client->is_active
                        ? ClientStatus::Active->value
                        : ClientStatus::Inactive->value,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table): void {
            $table->dropColumn(['status', 'archived_at']);
        });
    }
};
