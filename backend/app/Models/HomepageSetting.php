<?php

namespace App\Models;

use App\Support\HomepageMediaStorage;
use Illuminate\Database\Eloquent\Model;

class HomepageSetting extends Model
{
    protected $fillable = [
        'hero_title',
        'hero_highlight',
        'hero_description',
        'hero_background_path',
    ];

    public function backgroundUrl(): ?string
    {
        return HomepageMediaStorage::url($this->hero_background_path);
    }
}
