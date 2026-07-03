<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('quotes')
            ->join('clients', 'quotes.client_id', '=', 'clients.id')
            ->whereNull('quotes.tenant_id')
            ->whereNotNull('clients.tenant_id')
            ->update([
                'quotes.tenant_id' => DB::raw('clients.tenant_id'),
            ]);
    }

    public function down(): void
    {
        // Non-reversible data backfill.
    }
};
