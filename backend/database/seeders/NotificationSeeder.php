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
                'message' => 'Le chantier « Construction d\'une Résidence R+4 » (client Adam Zakin) vous a été assigné en tant que conducteur de travaux.',
                'created_at' => now()->subMinutes(12),
            ],
            [
                'title' => 'Retard signalé — lot Gros Œuvre',
                'message' => 'La tâche « Élévation des murs R+1 à R+4 » du projet PRJ-2026-001 accuse 5 jours de retard sur le planning.',
                'created_at' => now()->subHours(3),
            ],
            [
                'title' => 'Devis en attente de validation',
                'message' => 'Le devis DEVIS-2026-002 (Direction des Routes — VRD Médiouna) attend validation du maître d\'ouvrage.',
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
