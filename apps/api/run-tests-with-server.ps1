#!/usr/bin/env powershell

# Script para rodar testes com servidor iniciado

Write-Host "Iniciando API server..." -ForegroundColor Green

# Start server in a job
$serverJob = Start-Job -ScriptBlock {
    Set-Location "C:\TrackTime\apps\api"
    npm run start
} -Name "APIServer"

# Wait for server to start
Write-Host "Aguardando servidor iniciar..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Run tests
Write-Host "Executando testes..." -ForegroundColor Green
cd "C:\TrackTime"
npm run -w @tracktime/api test:auth

# Capture test result
$testResult = $LASTEXITCODE

# Stop server
Write-Host "Encerrando servidor..." -ForegroundColor Yellow
Stop-Job -Job $serverJob
Remove-Job -Job $serverJob

exit $testResult
