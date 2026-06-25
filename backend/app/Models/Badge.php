<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Badge extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id',
        'name',
        'color',
        'type',
    ];

    public function clients(): BelongsToMany
    {
        return $this->belongsToMany(Client::class, 'badge_client')
            ->withTimestamps();
    }
}
