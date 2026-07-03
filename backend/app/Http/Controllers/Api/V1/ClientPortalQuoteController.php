<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesClientPortalAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\ClientPortal\AcceptClientQuoteRequest;
use App\Http\Resources\ClientPortalQuoteResource;
use App\Models\Quote;
use App\Services\ClientPortalQuoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class ClientPortalQuoteController extends Controller
{
    use ResolvesClientPortalAccess;

    public function __construct(
        private readonly ClientPortalQuoteService $clientPortalQuoteService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $client = $this->resolveClientForUser($request);

        return ClientPortalQuoteResource::collection(
            $this->clientPortalQuoteService->quotesForClient($client)
        );
    }

    public function show(Request $request, Quote $quote): ClientPortalQuoteResource
    {
        $client = $this->resolveClientForUser($request);
        $quote = $this->clientPortalQuoteService->resolveQuoteForClient($client, $quote);

        return new ClientPortalQuoteResource($quote);
    }

    public function preview(Request $request, Quote $quote): JsonResponse
    {
        $client = $this->resolveClientForUser($request);
        $quote = $this->clientPortalQuoteService->resolveQuoteForClient($client, $quote);

        return response()->json(
            $this->clientPortalQuoteService->buildPreview($quote)
        );
    }

    public function accept(AcceptClientQuoteRequest $request, Quote $quote): ClientPortalQuoteResource
    {
        $client = $this->resolveClientForUser($request);
        $quote = $this->clientPortalQuoteService->resolveQuoteForClient($client, $quote);

        try {
            $quote = $this->clientPortalQuoteService->acceptQuote(
                $quote,
                $request->user(),
                $request->validated('signature_data'),
            );
        } catch (InvalidArgumentException $exception) {
            abort(422, $exception->getMessage());
        }

        return new ClientPortalQuoteResource($quote);
    }
}
