# Compile PFE report (XeLaTeX + biber)
Set-Location $PSScriptRoot

Write-Host "Compiling (1/4): xelatex..." -ForegroundColor Cyan
xelatex -interaction=nonstopmode main.tex
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Compiling (2/4): biber..." -ForegroundColor Cyan
biber main
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Compiling (3/4): xelatex..." -ForegroundColor Cyan
xelatex -interaction=nonstopmode main.tex
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Compiling (4/4): xelatex..." -ForegroundColor Cyan
xelatex -interaction=nonstopmode main.tex
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Done: main.pdf" -ForegroundColor Green
