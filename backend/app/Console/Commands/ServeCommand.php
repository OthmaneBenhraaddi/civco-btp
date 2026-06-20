<?php

namespace App\Console\Commands;

use App\Support\UploadEnvironment;
use Illuminate\Foundation\Console\ServeCommand as BaseServeCommand;

use function Illuminate\Support\php_binary;

class ServeCommand extends BaseServeCommand
{
    protected function serverCommand()
    {
        $server = file_exists(base_path('server.php'))
            ? base_path('server.php')
            : __DIR__.'/../../../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php';

        return array_merge(
            [php_binary()],
            UploadEnvironment::phpFlags(),
            ['-S', $this->host().':'.$this->port(), $server],
        );
    }
}
