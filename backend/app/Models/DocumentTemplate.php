<?php

namespace App\Models;

use App\Enums\DocumentTemplateType;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class DocumentTemplate extends Model
{
    use BelongsToTenant;

    public const MAX_PER_TENANT = 10;

    protected $fillable = [
        'tenant_id',
        'name',
        'type',
        'body',
    ];

    protected function casts(): array
    {
        return [
            'type' => DocumentTemplateType::class,
        ];
    }
}
