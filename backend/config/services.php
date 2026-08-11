<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'nominatim' => [
        'contact_email' => env('NOMINATIM_CONTACT_EMAIL', 'contact@civco-btp.ma'),
        'ca_bundle' => env('NOMINATIM_CA_BUNDLE'),
    ],

    'document_renderer' => [
        'url' => env('DOCUMENT_RENDERER_URL'),
        'token' => env('DOCUMENT_RENDERER_SECRET'),
        'timeout' => env('DOCUMENT_RENDERER_TIMEOUT', 10),
    ],

    'notification_dispatcher' => [
        'url' => env('NOTIFICATION_DISPATCHER_URL'),
        'token' => env('NOTIFICATION_DISPATCHER_SECRET'),
        'timeout' => env('NOTIFICATION_DISPATCHER_TIMEOUT', 10),
    ],

];
