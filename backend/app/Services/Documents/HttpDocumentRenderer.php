<?php

namespace App\Services\Documents;

use App\Contracts\Documents\DocumentRenderer;
use App\Dto\Documents\RenderRequest;
use App\Dto\Documents\RenderResponse;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

final class HttpDocumentRenderer implements DocumentRenderer
{
    public function __construct(
        private readonly LocalDocumentRenderer $localFallback,
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly int $timeout = 10,
    ) {}

    public function render(RenderRequest $request): RenderResponse
    {
        try {
            $response = Http::timeout($this->timeout)
                ->acceptJson()
                ->asJson()
                ->withToken($this->token)
                ->withHeaders([
                    'X-Internal-Token' => $this->token,
                ])
                ->post($this->baseUrl.'/internal/v1/render', $request->toArray());

            if ($response->failed()) {
                Log::warning('Document renderer returned an HTTP error, falling back to local compile.', [
                    'status' => $response->status(),
                    'url' => $this->baseUrl,
                ]);

                return $this->localFallback->render($request);
            }

            $html = $response->json('html');

            if (! is_string($html)) {
                Log::warning('Document renderer returned an invalid payload, falling back to local compile.', [
                    'url' => $this->baseUrl,
                ]);

                return $this->localFallback->render($request);
            }

            return new RenderResponse($html);
        } catch (ConnectionException|Throwable $exception) {
            Log::warning('Document renderer unreachable, falling back to local compile.', [
                'url' => $this->baseUrl,
                'error' => $exception->getMessage(),
            ]);

            return $this->localFallback->render($request);
        }
    }
}
