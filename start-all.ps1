Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
docker compose up -d --build
docker compose ps
Write-Host "OptiVest is starting: frontend http://localhost:3000, backend http://localhost:8000/docs, database localhost:5432"
