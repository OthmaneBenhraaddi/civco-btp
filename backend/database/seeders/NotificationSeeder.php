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

        $samples = [
            [
                'title' => 'Nouveau projet assigné',
                'message' => 'Le chantier « Résidence Les Oliviers » vous a été assigné en tant que conducteur de travaux.',
                'created_at' => now()->subMinutes(5),
            ],
            [
                'title' => 'Retard sur le lot Gros Œuvre',
                'message' => 'Le lot Gros Œuvre du projet PRJ-2026-004 accuse 3 jours de retard sur le planning initial.',
                'created_at' => now()->subHours(2),
            ],
            [
                'title' => 'Devis en attente de validation',
                'message' => 'Le devis DEV-2026-018 (client Mairie de Lyon) attend votre validation avant envoi.',
                'created_at' => now()->subDay(),
            ],
        ];

        foreach ($samples as $sample) {
            Notification::query()->updateOrCreate(
                [
                    'user_id' => $admin->id,
                    'title' => $sample['title'],
                ],
                [
                    'message' => $sample['message'],
                    'read_at' => null,
                    'created_at' => $sample['created_at'],
                ],
            );
        }
    }
}
