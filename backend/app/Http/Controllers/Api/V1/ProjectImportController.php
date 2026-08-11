<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Concerns\ResolvesUserAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\ImportProjectExcelRequest;
use App\Models\Project;
use App\Services\PermissionResolver;
use App\Services\ProjectImport\ProjectExcelImportService;
use App\Services\ProjectImport\ProjectExcelTemplateService;
use App\Services\TaskAuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProjectImportController extends Controller
{
    use ResolvesCompanyContext;
    use ResolvesUserAccess;

    public function __construct(
        private readonly ProjectExcelTemplateService $templateService,
        private readonly ProjectExcelImportService $importService,
        private readonly TaskAuthorizationService $taskAuthorization,
        private readonly PermissionResolver $permissionResolver,
    ) {}

    public function template(Request $request, Project $project): Response
    {
        $this->ensureProjectAccessibleToUser($request, $project);

        $binary = $this->templateService->buildBinary();
        $filename = $this->importService->filenameFor($project);

        return response($binary, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Content-Length' => (string) strlen($binary),
        ]);
    }

    public function import(ImportProjectExcelRequest $request, Project $project): JsonResponse
    {
        $this->ensureProjectAccessibleToUser($request, $project);
        $this->ensureCanCreateTasks($request);

        $parsed = $this->importService->parse($request->file('file'));

        if (! $parsed->isValid()) {
            return response()->json([
                'message' => sprintf(
                    'Le fichier contient %d erreur(s). Aucune donnée n\'a été importée.',
                    count($parsed->errors),
                ),
                'errors' => array_map(fn ($error) => $error->toArray(), $parsed->errors),
            ], 422);
        }

        $summary = $this->importService->import($project, $parsed);

        return response()->json([
            'message' => sprintf('%d tâche(s) importée(s) avec succès.', $summary['tasks_imported']),
            'data' => $summary,
        ]);
    }

    private function ensureCanCreateTasks(Request $request): void
    {
        $user = $this->authenticatedUser($request);
        $permissions = $this->permissionResolver->expand(
            $user->permissionSlugsForCompany($this->companyId($request)),
        );

        if (! $this->taskAuthorization->canCreateTasks($user, $permissions)) {
            abort(403, 'Vous n\'avez pas la permission d\'importer des tâches.');
        }
    }
}
