<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$publicPath = $root . DIRECTORY_SEPARATOR . 'public';
$tmpDir = $root . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'framework' . DIRECTORY_SEPARATOR . 'uploads-tmp';

if (! is_dir($tmpDir)) {
    mkdir($tmpDir, 0755, true);
}

if (! is_writable($tmpDir)) {
    fwrite(STDERR, "Upload temp directory is not writable: {$tmpDir}" . PHP_EOL);
    exit(1);
}

$host = '127.0.0.1';
$port = '8000';

foreach (array_slice($argv, 1) as $arg) {
    if (str_starts_with($arg, '--host=')) {
        $host = substr($arg, 7);
    } elseif (str_starts_with($arg, '--port=')) {
        $port = substr($arg, 7);
    }
}

$serverRouter = $root . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'laravel'
    . DIRECTORY_SEPARATOR . 'framework' . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR
    . 'Illuminate' . DIRECTORY_SEPARATOR . 'Foundation' . DIRECTORY_SEPARATOR . 'resources'
    . DIRECTORY_SEPARATOR . 'server.php';

$tmpDirForIni = str_replace('\\', '/', $tmpDir);

chdir($publicPath);

$command = sprintf(
    '%s -d upload_tmp_dir=%s -d upload_max_filesize=12M -d post_max_size=14M -d display_errors=0 -S %s:%s %s',
    escapeshellarg(PHP_BINARY),
    $tmpDirForIni,
    $host,
    $port,
    escapeshellarg($serverRouter),
);

fwrite(STDOUT, "BTP backend running on http://{$host}:{$port}" . PHP_EOL);
fwrite(STDOUT, "Upload temp directory: {$tmpDirForIni}" . PHP_EOL);

passthru($command, $exitCode);
exit($exitCode);
