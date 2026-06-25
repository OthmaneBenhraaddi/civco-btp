<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->where('email', 'admin@btpdemo.fr')->first();

        if (! $admin) {
            return;
        }

        Notification::query()->where('user_id', $admin->id)->delete();

        $samples = [
            [
                'title' => 'Nouveau projet assigné',
                'message' => 'Le chantier « Aménagement du Boulevard Panoramique (VRD) » vous a été assigné en tant que conducteur de travaux.',
                'created_at' => now()->subMinutes(18),
            ],
            [
                'title' => 'Visite chantier planifiée',
                'message' => 'Amine Alami est attendu à 09:00 sur le lotissement California — villa Al Omrane.',
                'created_at' => now()->subHours(2),
            ],
            [
                'title' => 'Devis en attente',
                'message' => 'Le devis DEVIS-2026-004 (SJL Maghreb Transport) attend signature client.',
                'created_at' => now()->subDay(),
            ],
        ];

        foreach ($samples as $sample) {
            Notification::query()->create([
                'user_id' => $admin->id,
                'title' => $sample['title'],
                'message' => $sample['message'],
                'read_at' => null,
                'created_at' => $sample['created_at'],
            ]);
        }
    }
}
