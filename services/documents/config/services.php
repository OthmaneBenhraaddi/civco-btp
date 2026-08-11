<?php

return [
    'internal' => [
        'token' => env('INTERNAL_RENDERER_SECRET', env('DOCUMENT_RENDERER_SECRET')),
    ],
];
