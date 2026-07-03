<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PortalMessageThreadListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'general' => $this->resource['general'],
            'projects' => $this->resource['projects'],
        ];
    }
}
