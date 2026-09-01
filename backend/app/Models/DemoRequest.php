<?php

namespace App\Models;

use App\Enums\DemoRequestStatus;
use Illuminate\Database\Eloquent\Model;

class DemoRequest extends Model
{
    protected $fillable = [
        'full_name',
        'company_name',
        'email',
        'phone',
        'message',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => DemoRequestStatus::class,
        ];
    }
}
