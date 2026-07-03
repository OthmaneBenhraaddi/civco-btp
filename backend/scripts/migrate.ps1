# Run pending Laravel migrations using the local PHP 8.4 install (WinGet).
# Usage: .\scripts\migrate.ps1

$ErrorActionPreference = 'Stop'

$phpCandidates = @(
    'C:\Users\benhr\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe',
    (Get-Command php -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)
)

$php = $phpCandidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

if (-not $php) {
    Write-Error 'PHP 8.4+ not found. Install PHP 8.4 via winget: winget install PHP.PHP.8.4'
}

$backendRoot = Split-Path $PSScriptRoot -Parent
Push-Location $backendRoot

try {
    Write-Host "Using PHP: $php" -ForegroundColor Cyan
    & $php artisan migrate --force
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
    Write-Host 'Migrations applied successfully.' -ForegroundColor Green
} finally {
    Pop-Location
}
