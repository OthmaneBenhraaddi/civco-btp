<?php

namespace App\Models;

use App\Support\HomepageMediaStorage;
use Illuminate\Database\Eloquent\Model;

class HomepagePartner extends Model
{
    protected $fillable = [
        'name',
        'logo_path',
        'sort_order',
    ];

    public function logoUrl(): ?string
    {
        return HomepageMediaStorage::url($this->logo_path);
    }
}
