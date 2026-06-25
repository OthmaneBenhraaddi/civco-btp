<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$config = [];

foreach (file($root . '/.env', FILE_IGNORE_NEW_LINES) as $line) {
    $line = trim($line);

    if ($line === '' || str_starts_with($line, '#') || ! str_contains($line, '=')) {
        continue;
    }

    [$key, $value] = explode('=', $line, 2);
    $config[trim($key)] = trim($value, " \t\"'");
}

$host = $config['DB_HOST'] ?? '127.0.0.1';
$port = $config['DB_PORT'] ?? '3306';
$user = $config['DB_USERNAME'] ?? 'root';
$pass = $config['DB_PASSWORD'] ?? '';
$database = $config['DB_DATABASE'] ?? 'civco_btp';

$schemaPath = $root . '/database/schema/btp_pfa_complete_schema.sql';

if (! is_file($schemaPath)) {
    fwrite(STDERR, "Schema file not found: {$schemaPath}\n");
    exit(1);
}

$sql = file_get_contents($schemaPath);
$sql = preg_replace('/^CREATE DATABASE IF NOT EXISTS.*?;\s*/mi', '', $sql);
$sql = preg_replace('/^USE `.*?`;\s*/mi', '', $sql);

$bootstrap = <<<SQL
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';
USE `{$database}`;

SQL;

$dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
$pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

$pdo->exec("DROP DATABASE IF EXISTS `{$database}`");
$pdo->exec("CREATE DATABASE `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

$dsnWithDb = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
$pdo = new PDO($dsnWithDb, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::MYSQL_ATTR_MULTI_STATEMENTS => true,
]);

$pdo->exec($bootstrap . $sql);

$tableCount = (int) $pdo->query(
    'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ' . $pdo->quote($database)
)->fetchColumn();

echo "OK: imported schema into {$database} ({$tableCount} tables)\n";
