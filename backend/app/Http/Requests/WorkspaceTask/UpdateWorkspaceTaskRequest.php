<?php

namespace App\Http\Requests\WorkspaceTask;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWorkspaceTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => ['sometimes', 'string', 'max:200'],
            'responsable_name' => ['sometimes', 'string', 'max:150'],
            'statut' => ['sometimes', Rule::in(['en_cours', 'termine', 'bloque', 'non_commence'])],
            'priorite' => ['sometimes', Rule::in(['haute', 'moyenne', 'basse'])],
            'echeance' => ['sometimes', 'date'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'fichiers' => ['nullable', 'array'],
            'fichiers.*' => ['string', 'max:255'],
        ];
    }
}
