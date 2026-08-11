<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (! Schema::hasColumn('tenants', 'max_official_prints')) {
                $table->unsignedTinyInteger('max_official_prints')->default(2)->after('status');
            }
        });

        Schema::create('dispatch_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained()->restrictOnDelete();
            $table->string('reference_number', 50);
            $table->string('status', 30)->default('draft');
            $table->timestamp('executed_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'reference_number']);
        });

        Schema::table('delivery_forms', function (Blueprint $table) {
            $table->foreignId('dispatch_note_id')
                ->nullable()
                ->after('invoice_id')
                ->constrained('dispatch_notes')
                ->nullOnDelete();

            if (! Schema::hasColumn('delivery_forms', 'generation_count') && ! Schema::hasColumn('delivery_forms', 'print_count')) {
                $table->unsignedInteger('generation_count')->default(0)->after('status');
            }
        });

        DB::table('delivery_forms')
            ->where('status', 'invoiced')
            ->update(['status' => 'signed_and_stamped']);

        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('dispatch_note_id')
                ->nullable()
                ->after('quote_id')
                ->constrained('dispatch_notes')
                ->nullOnDelete();
        });

        Schema::table('contracts', function (Blueprint $table) {
            if (! Schema::hasColumn('contracts', 'generation_count') && ! Schema::hasColumn('contracts', 'print_count')) {
                $table->unsignedInteger('generation_count')->default(0)->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn('print_count');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['dispatch_note_id']);
            $table->dropColumn('dispatch_note_id');
        });

        Schema::table('delivery_forms', function (Blueprint $table) {
            $table->dropForeign(['dispatch_note_id']);
            $table->dropColumn(['dispatch_note_id', 'print_count']);
        });

        Schema::dropIfExists('dispatch_notes');

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('max_official_prints');
        });
    }
};
