<?php

namespace App\Models;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Concerns\BelongsToCompany;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
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
        'is_cms_ticket',
        'created_by_user_id',
        'target_admin_id',
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
            'is_cms_ticket' => 'boolean',
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

    public function targetAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_admin_id');
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
        if ($this->is_cms_ticket) {
            $status = $actor->isSuperAdmin()
                ? TicketStatus::AwaitingStaff
                : TicketStatus::AwaitingClient;
        } else {
            $status = $actor->isClientPortalUser()
                ? TicketStatus::AwaitingStaff
                : TicketStatus::AwaitingClient;
        }

        $this->update(['status' => $status]);
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isClientPortalUser()) {
            return $query
                ->where('is_cms_ticket', false)
                ->where('client_id', $user->client_id);
        }

        if ($user->isSuperAdmin()) {
            return $query->where('is_cms_ticket', true);
        }

        return $query->where(function (Builder $builder) use ($user): void {
            $builder->where('is_cms_ticket', false);

            if ($user->isAdmin() && $user->tenant_id !== null) {
                $builder->orWhere(function (Builder $cms) use ($user): void {
                    $cms->where('is_cms_ticket', true)
                        ->where($cms->getModel()->getTable().'.tenant_id', $user->tenant_id)
                        ->where(function (Builder $target) use ($user): void {
                            $target->whereNull('target_admin_id')
                                ->orWhere('target_admin_id', $user->id);
                        });
                });
            }
        });
    }
}
