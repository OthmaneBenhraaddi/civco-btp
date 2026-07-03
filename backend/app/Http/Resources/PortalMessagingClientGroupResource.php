<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PortalMessagingClientGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'client_user_id' => $this->resource['client_user_id'],
            'client_name' => $this->resource['client_name'],
            'client_email' => $this->resource['client_email'],
            'unread_count' => $this->resource['unread_count'],
            'threads' => $this->resource['threads'],
        ];
    }
}
