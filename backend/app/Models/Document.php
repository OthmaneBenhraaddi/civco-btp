<?php

namespace App\Models;

use App\Enums\DocumentStatus;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Document extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id',
        'uploaded_by_user_id',
        'documentable_type',
        'documentable_id',
        'original_filename',
        'storage_path',
        'mime_type',
        'file_size',
        'category',
        'status',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => DocumentStatus::class,
            'archived_at' => 'datetime',
        ];
    }

    public function documentable(): MorphTo
    {
        return $this->morphTo();
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }
}
