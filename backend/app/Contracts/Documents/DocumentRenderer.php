<?php

namespace App\Contracts\Documents;

use App\Dto\Documents\RenderRequest;
use App\Dto\Documents\RenderResponse;

interface DocumentRenderer
{
    public function render(RenderRequest $request): RenderResponse;
}
