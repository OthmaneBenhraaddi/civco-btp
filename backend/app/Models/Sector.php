<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sector extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id',
        'name',
    ];

    public function lots(): HasMany
    {
        return $this->hasMany(Lot::class)->orderBy('name');
    }
}
