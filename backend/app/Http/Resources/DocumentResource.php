<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Document */
class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'documentable_type' => $this->documentable_type,
            'documentable_id' => $this->documentable_id,
            'original_filename' => $this->original_filename,
            'mime_type' => $this->mime_type,
            'file_size' => $this->file_size,
            'document_type_id' => $this->document_type_id,
            'category' => $this->displayCategoryName(),
            'category_label' => $this->category_label,
            'type_removed' => $this->document_type_id === null && filled($this->category_label),
            'document_type' => $this->whenLoaded('documentType', fn () => $this->documentType ? [
                'id' => $this->documentType->id,
                'name' => $this->documentType->name,
                'is_active' => $this->documentType->is_active,
            ] : null),
            'status' => $this->status->value,
            'archived_at' => $this->archived_at?->toIso8601String(),
            'uploaded_by' => $this->whenLoaded('uploadedBy', fn () => [
                'id' => $this->uploadedBy->id,
                'full_name' => $this->uploadedBy->full_name,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
