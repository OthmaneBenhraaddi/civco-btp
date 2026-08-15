<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            Schema::table('tickets', function (Blueprint $table): void {
                $table->foreignId('project_id')->nullable()->change();
            });
        } else {
            Schema::table('tickets', function (Blueprint $table): void {
                $table->dropForeign(['project_id']);
            });

            DB::statement('ALTER TABLE tickets MODIFY project_id BIGINT UNSIGNED NULL');

            Schema::table('tickets', function (Blueprint $table): void {
                $table->foreign('project_id')->references('id')->on('projects')->nullOnDelete();
            });
        }

        $tickets = DB::table('tickets')
            ->whereIn('status', ['open', 'awaiting'])
            ->get(['id', 'created_by_user_id']);

        foreach ($tickets as $ticket) {
            $lastSenderId = DB::table('ticket_messages')
                ->where('ticket_id', $ticket->id)
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->value('sender_id');

            $actorId = $lastSenderId ?? $ticket->created_by_user_id;
            $isClientActor = $actorId !== null
                && DB::table('users')->where('id', $actorId)->whereNotNull('client_id')->exists();

            // Last speaker leaves the ball with the other party.
            $nextStatus = $isClientActor ? 'awaiting_staff' : 'awaiting_client';

            DB::table('tickets')->where('id', $ticket->id)->update(['status' => $nextStatus]);
        }
    }

    public function down(): void
    {
        DB::table('tickets')
            ->whereIn('status', ['awaiting_client', 'awaiting_staff'])
            ->update(['status' => 'awaiting']);

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            return;
        }

        Schema::table('tickets', function (Blueprint $table): void {
            $table->dropForeign(['project_id']);
        });

        DB::statement('ALTER TABLE tickets MODIFY project_id BIGINT UNSIGNED NOT NULL');

        Schema::table('tickets', function (Blueprint $table): void {
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
        });
    }
};
