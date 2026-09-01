<?php

namespace App\Services;

use App\Models\HomepageCard;
use App\Models\HomepagePartner;
use App\Models\HomepageSetting;
use App\Support\HomepageMediaStorage;
use Illuminate\Http\UploadedFile;

class HomepageContentService
{
    public const DEFAULT_HERO_TITLE = 'Entrez dans un monde de chantiers illimités';

    public const DEFAULT_HERO_HIGHLIGHT = 'chantiers illimités';

    public const DEFAULT_HERO_DESCRIPTION = 'Une ville de chantiers où les relations font les contrats. Ouvrez un projet, approvisionnez un autre, construisez un empire de lots — avec de vrais outils pour chaque équipe.';

    public function publicPayload(): array
    {
        $this->ensureDefaults();

        $settings = HomepageSetting::query()->first();
        $partners = HomepagePartner::query()->orderBy('sort_order')->orderBy('id')->get();
        $cards = HomepageCard::query()->orderBy('sort_order')->orderBy('id')->get();

        return [
            'hero' => [
                'title' => $settings?->hero_title ?: self::DEFAULT_HERO_TITLE,
                'highlight' => $settings?->hero_highlight ?: self::DEFAULT_HERO_HIGHLIGHT,
                'description' => $settings?->hero_description ?: self::DEFAULT_HERO_DESCRIPTION,
                'background_url' => $settings?->backgroundUrl(),
            ],
            'partners' => $partners->map(fn (HomepagePartner $partner) => [
                'id' => $partner->id,
                'name' => $partner->name,
                'logo_url' => $partner->logoUrl(),
            ])->values()->all(),
            'cards' => $cards->map(fn (HomepageCard $card) => [
                'id' => $card->id,
                'slug' => $card->slug,
                'title' => $card->title,
                'description' => $card->description,
                'image_url' => $card->imageUrl(),
                'tall' => $card->tall,
            ])->values()->all(),
        ];
    }

    public function updateCopy(array $attributes): array
    {
        $this->ensureDefaults();

        $settings = HomepageSetting::query()->first();
        $settings?->update([
            'hero_title' => $attributes['hero_title'] ?? $settings->hero_title,
            'hero_highlight' => $attributes['hero_highlight'] ?? $settings->hero_highlight,
            'hero_description' => $attributes['hero_description'] ?? $settings->hero_description,
        ]);

        foreach ($attributes['cards'] ?? [] as $cardPayload) {
            if (! isset($cardPayload['id'])) {
                continue;
            }

            HomepageCard::query()->whereKey($cardPayload['id'])->update([
                'title' => $cardPayload['title'] ?? '',
                'description' => $cardPayload['description'] ?? null,
            ]);
        }

        return $this->publicPayload();
    }

    public function replaceHeroBackground(UploadedFile $file): array
    {
        $this->ensureDefaults();
        $settings = HomepageSetting::query()->first();

        $path = HomepageMediaStorage::replace(
            $file,
            'homepage/hero',
            $settings?->hero_background_path,
        );

        $settings?->update(['hero_background_path' => $path]);

        return $this->publicPayload();
    }

    public function deleteHeroBackground(): array
    {
        $settings = HomepageSetting::query()->first();
        HomepageMediaStorage::delete($settings?->hero_background_path);
        $settings?->update(['hero_background_path' => null]);

        return $this->publicPayload();
    }

    public function storePartner(UploadedFile $file, string $name): HomepagePartner
    {
        $this->ensureDefaults();

        $maxOrder = (int) HomepagePartner::query()->max('sort_order');

        return HomepagePartner::query()->create([
            'name' => $name,
            'logo_path' => HomepageMediaStorage::store($file, 'homepage/partners'),
            'sort_order' => $maxOrder + 1,
        ]);
    }

    public function deletePartner(HomepagePartner $partner): void
    {
        HomepageMediaStorage::delete($partner->logo_path);
        $partner->delete();
    }

    public function replaceCardImage(HomepageCard $card, UploadedFile $file): HomepageCard
    {
        $path = HomepageMediaStorage::replace($file, 'homepage/cards', $card->image_path);
        $card->update(['image_path' => $path]);

        return $card->fresh();
    }

    public function deleteCardImage(HomepageCard $card): HomepageCard
    {
        HomepageMediaStorage::delete($card->image_path);
        $card->update(['image_path' => null]);

        return $card->fresh();
    }

    public function ensureDefaults(): void
    {
        if (! HomepageSetting::query()->exists()) {
            HomepageSetting::query()->create([
                'hero_title' => self::DEFAULT_HERO_TITLE,
                'hero_highlight' => self::DEFAULT_HERO_HIGHLIGHT,
                'hero_description' => self::DEFAULT_HERO_DESCRIPTION,
            ]);
        }

        if (HomepageCard::query()->exists()) {
            return;
        }

        foreach ($this->defaultCards() as $index => $card) {
            HomepageCard::query()->create([
                ...$card,
                'sort_order' => $index,
            ]);
        }
    }

    /**
     * @return list<array{slug: string, title: string, description: string, fallback_image_url: string, tall: bool}>
     */
    private function defaultCards(): array
    {
        return [
            [
                'slug' => 'feat-1',
                'title' => 'Carte interactive des projets',
                'description' => 'Suivez chaque chantier en temps réel — phases, lots et statut opérationnel sur une carte vivante.',
                'fallback_image_url' => 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
                'tall' => true,
            ],
            [
                'slug' => 'feat-2',
                'title' => 'Outils client & avenants',
                'description' => 'Workflow d’avenants pour clients publics et privés — validations, révisions et piste d’audit.',
                'fallback_image_url' => 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
                'tall' => false,
            ],
            [
                'slug' => 'feat-3',
                'title' => 'Équipes & droits d’accès',
                'description' => 'Contrôle des rôles pour chefs de chantier, ingénieurs et bureau — une seule source de vérité.',
                'fallback_image_url' => 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
                'tall' => false,
            ],
            [
                'slug' => 'feat-4',
                'title' => 'Chaque détail, repensé',
                'description' => 'Du devis à la facture, documents et dépenses — la boucle BTP complète dans un centre de commande.',
                'fallback_image_url' => 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
                'tall' => true,
            ],
        ];
    }
}
