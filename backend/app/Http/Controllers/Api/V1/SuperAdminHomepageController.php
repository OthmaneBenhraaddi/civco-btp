<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StoreHomepageMediaRequest;
use App\Http\Requests\SuperAdmin\StoreHomepagePartnerRequest;
use App\Http\Requests\SuperAdmin\UpdateHomepageRequest;
use App\Models\HomepageCard;
use App\Models\HomepagePartner;
use App\Services\HomepageContentService;
use Illuminate\Http\JsonResponse;

class SuperAdminHomepageController extends Controller
{
    public function __construct(
        private readonly HomepageContentService $homepage,
    ) {}

    public function show(): JsonResponse
    {
        return response()->json($this->homepage->publicPayload());
    }

    public function update(UpdateHomepageRequest $request): JsonResponse
    {
        return response()->json($this->homepage->updateCopy($request->validated()));
    }

    public function storeHeroBackground(StoreHomepageMediaRequest $request): JsonResponse
    {
        return response()->json(
            $this->homepage->replaceHeroBackground($request->file('image')),
        );
    }

    public function destroyHeroBackground(): JsonResponse
    {
        return response()->json($this->homepage->deleteHeroBackground());
    }

    public function storePartner(StoreHomepagePartnerRequest $request): JsonResponse
    {
        $partner = $this->homepage->storePartner(
            $request->file('logo'),
            $request->string('name')->toString(),
        );

        return response()->json([
            'partner' => [
                'id' => $partner->id,
                'name' => $partner->name,
                'logo_url' => $partner->logoUrl(),
            ],
            ...$this->homepage->publicPayload(),
        ], 201);
    }

    public function destroyPartner(HomepagePartner $partner): JsonResponse
    {
        $this->homepage->deletePartner($partner);

        return response()->json($this->homepage->publicPayload());
    }

    public function storeCardImage(StoreHomepageMediaRequest $request, HomepageCard $card): JsonResponse
    {
        $this->homepage->replaceCardImage($card, $request->file('image'));

        return response()->json($this->homepage->publicPayload());
    }

    public function destroyCardImage(HomepageCard $card): JsonResponse
    {
        $this->homepage->deleteCardImage($card);

        return response()->json($this->homepage->publicPayload());
    }
}
