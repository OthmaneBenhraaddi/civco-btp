<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('workspace_tasks')) {
            Schema::create('workspace_tasks', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('company_id')->constrained()->cascadeOnDelete();
                $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
                $table->string('project_name', 200);
                $table->string('nom', 200);
                $table->string('responsable_name', 150);
                $table->string('responsable_avatar_url', 500)->nullable();
                $table->enum('statut', ['en_cours', 'termine', 'bloque', 'non_commence'])->default('non_commence');
                $table->enum('priorite', ['haute', 'moyenne', 'basse'])->default('moyenne');
                $table->date('echeance');
                $table->decimal('budget', 15, 2)->default(0);
                $table->text('notes')->nullable();
                $table->foreignId('last_updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('last_updated_by_name', 150)->nullable();
                $table->timestamps();

                $table->index(['company_id', 'statut']);
                $table->index(['company_id', 'echeance']);
            });
        }

        if (! Schema::hasTable('workspace_task_files')) {
            Schema::create('workspace_task_files', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('workspace_task_id')->constrained()->cascadeOnDelete();
                $table->string('filename', 255);
                $table->timestamps();

                $table->index('workspace_task_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_task_files');
        Schema::dropIfExists('workspace_tasks');
    }
};
