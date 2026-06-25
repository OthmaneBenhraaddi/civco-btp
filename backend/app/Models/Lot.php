<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Lot extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id',
        'name',
        'sector_id',
    ];

    public function sector(): BelongsTo
    {
        return $this->belongsTo(Sector::class);
    }

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'lot_project')
            ->withTimestamps();
    }
}
