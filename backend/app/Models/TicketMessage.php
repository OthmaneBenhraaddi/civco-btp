<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketMessage extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'ticket_id',
        'sender_id',
        'sender_role',
        'body',
    ];

    public static function roleFor(User $user): string
    {
        if ($user->isSuperAdmin()) {
            return 'superadmin';
        }

        if ($user->isClientPortalUser()) {
            return 'client';
        }

        if ($user->isAdmin()) {
            return 'entity_admin';
        }

        return 'staff';
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
