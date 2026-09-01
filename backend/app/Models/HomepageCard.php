<?php

namespace App\Models;

use App\Support\HomepageMediaStorage;
use Illuminate\Database\Eloquent\Model;

class HomepageCard extends Model
{
    protected $fillable = [
        'slug',
        'title',
        'description',
        'image_path',
        'fallback_image_url',
        'tall',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'tall' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function imageUrl(): ?string
    {
        return HomepageMediaStorage::url($this->image_path) ?? $this->fallback_image_url;
    }
}
