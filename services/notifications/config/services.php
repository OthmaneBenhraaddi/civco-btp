<?php

return [
    'internal' => [
        'token' => env('INTERNAL_NOTIFICATION_SECRET', env('NOTIFICATION_DISPATCHER_SECRET')),
    ],
];
