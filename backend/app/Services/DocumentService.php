<?php

namespace App\Services;

use App\Enums\DocumentStatus;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentService
{
    private const DISK = 'local';

    public function storeForProject(
        Project $project,
        UploadedFile $file,
        User $user,
        ?int $documentTypeId = null,
    ): Document {
        return $this->storeFor($project, $file, $user, $project->company_id, $documentTypeId);
    }

    public function storeFor(
        Model $documentable,
        UploadedFile $file,
        User $user,
        int $companyId,
        ?int $documentTypeId = null,
    ): Document {
        $documentType = null;

        if ($documentTypeId !== null) {
            $documentType = DocumentType::query()
                ->forCompany($companyId)
                ->where('is_active', true)
                ->findOrFail($documentTypeId);
        }

        $storagePath = $this->storeFile($file, $companyId);

        return Document::query()->create([
            'company_id' => $companyId,
            'uploaded_by_user_id' => $user->id,
            'documentable_type' => $documentable->getMorphClass(),
            'documentable_id' => $documentable->id,
            'original_filename' => $file->getClientOriginalName(),
            'storage_path' => $storagePath,
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'file_size' => $file->getSize(),
            'document_type_id' => $documentType?->id,
            'category_label' => null,
            'status' => DocumentStatus::Active,
        ]);
    }

    public function archive(Document $document): Document
    {
        $document->update([
            'status' => DocumentStatus::Archived,
            'archived_at' => now(),
        ]);

        return $document->fresh();
    }

    public function deleteFile(Document $document): void
    {
        if (Storage::disk(self::DISK)->exists($document->storage_path)) {
            Storage::disk(self::DISK)->delete($document->storage_path);
        }
    }

    private function storeFile(UploadedFile $file, int $companyId): string
    {
        $filename = Str::uuid()->toString().'_'.$file->getClientOriginalName();

        return $file->storeAs("documents/{$companyId}", $filename, self::DISK);
    }
}
