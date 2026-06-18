<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table): void {
            if (! Schema::hasColumn('roles', 'badge_tone')) {
                $table->string('badge_tone', 20)->nullable()->after('description');
            }
        });

        Schema::table('clients', function (Blueprint $table): void {
            if (! Schema::hasColumn('clients', 'client_role_slug')) {
                $table->string('client_role_slug', 50)->default('client_extern')->after('is_active');
            }
        });

        Schema::table('projects', function (Blueprint $table): void {
            if (! Schema::hasColumn('projects', 'nature')) {
                $table->enum('nature', ['VRD', 'BÂTIMENT'])->nullable()->after('status');
            }
            if (! Schema::hasColumn('projects', 'sector')) {
                $table->enum('sector', ['PRIVÉ', 'PUBLIC'])->default('PRIVÉ')->after('nature');
            }
            if (! Schema::hasColumn('projects', 'etat_paiement')) {
                $table->enum('etat_paiement', ['PAYÉ', 'NON PAYÉ'])->default('NON PAYÉ')->after('sector');
            }
            if (! Schema::hasColumn('projects', 'delais')) {
                $table->string('delais', 255)->nullable()->after('etat_paiement');
            }
            if (! Schema::hasColumn('projects', 'avancement')) {
                $table->string('avancement', 255)->nullable()->after('delais');
            }
            if (! Schema::hasColumn('projects', 'description_meta')) {
                $table->json('description_meta')->nullable()->after('description');
            }
        });

        if (! Schema::hasTable('project_lots')) {
            Schema::create('project_lots', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('project_id')->constrained()->cascadeOnDelete();
                $table->string('lot_name', 255);
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->unique(['project_id', 'lot_name']);
            });
        }

        if (! Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('company_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('actor_label', 200);
                $table->enum('action', ['creation', 'modification', 'suppression']);
                $table->string('entity_type', 50)->nullable();
                $table->unsignedBigInteger('entity_id')->nullable();
                $table->text('message');
                $table->timestamp('created_at')->useCurrent();

                $table->index(['company_id', 'created_at']);
                $table->index(['entity_type', 'entity_id']);
            });
        }

        Schema::table('payments', function (Blueprint $table): void {
            if (! Schema::hasColumn('payments', 'recorded_by_user_id')) {
                $table->foreignId('recorded_by_user_id')->nullable()->after('invoice_id')->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            if (Schema::hasColumn('payments', 'recorded_by_user_id')) {
                $table->dropConstrainedForeignId('recorded_by_user_id');
            }
        });

        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('project_lots');

        Schema::table('projects', function (Blueprint $table): void {
            $columns = ['description_meta', 'avancement', 'delais', 'etat_paiement', 'sector', 'nature'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('projects', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('clients', function (Blueprint $table): void {
            if (Schema::hasColumn('clients', 'client_role_slug')) {
                $table->dropColumn('client_role_slug');
            }
        });

        Schema::table('roles', function (Blueprint $table): void {
            if (Schema::hasColumn('roles', 'badge_tone')) {
                $table->dropColumn('badge_tone');
            }
        });
    }
};
