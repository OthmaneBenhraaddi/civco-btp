<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ProjectMedia */
class ProjectMediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'title' => $this->title,
            'image_path' => $this->image_path,
            'image_url' => $this->imageUrl(),
            'created_at' => $this->created_at?->toIso8601String(),
            'uploaded_by' => $this->uploadedBy ? [
                'id' => $this->uploadedBy->id,
                'full_name' => $this->uploadedBy->full_name,
            ] : null,
        ];
    }
}
