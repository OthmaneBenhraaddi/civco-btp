<?php

namespace App\Http\Requests\WorkspaceTask;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWorkspaceTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId = $this->attributes->get('company_id');

        return [
            'project_id' => [
                'required',
                'integer',
                Rule::exists('projects', 'id')->where('company_id', $companyId),
            ],
            'nom' => ['required', 'string', 'max:200'],
            'responsable_name' => ['required', 'string', 'max:150'],
            'statut' => ['sometimes', Rule::in(['en_cours', 'termine', 'bloque', 'non_commence'])],
            'priorite' => ['sometimes', Rule::in(['haute', 'moyenne', 'basse'])],
            'echeance' => ['required', 'date'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'fichiers' => ['nullable', 'array'],
            'fichiers.*' => ['string', 'max:255'],
        ];
    }
}
