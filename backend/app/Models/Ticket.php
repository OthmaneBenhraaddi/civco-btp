<?php

namespace App\Models;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Concerns\BelongsToCompany;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use BelongsToCompany;
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'company_id',
        'project_id',
        'client_id',
        'created_by_user_id',
        'title',
        'category',
        'priority',
        'status',
        'body',
        'closed_at',
        'closed_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'priority' => TicketPriority::class,
            'status' => TicketStatus::class,
            'closed_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by_user_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(TicketMessage::class)->orderBy('created_at');
    }

    public function isClosed(): bool
    {
        return $this->status?->isClosed() ?? false;
    }

    /**
     * After a message from $actor, the other party owes the next reply.
     */
    public function markAwaitingReplyFrom(User $actor): void
    {
        $status = $actor->isClientPortalUser()
            ? TicketStatus::AwaitingStaff
            : TicketStatus::AwaitingClient;

        $this->update(['status' => $status]);
    }
}
