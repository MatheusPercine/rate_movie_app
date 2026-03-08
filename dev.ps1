param(
    [switch]$NoNewWindows
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"
$venvPython = Join-Path $projectRoot ".venv\Scripts\python.exe"
$stateDir = Join-Path $projectRoot ".run"
$pidFile = Join-Path $stateDir "dev-processes.json"

if (-not (Test-Path $backendPath)) {
    throw "Pasta backend não encontrada em '$backendPath'."
}

if (-not (Test-Path $frontendPath)) {
    throw "Pasta frontend não encontrada em '$frontendPath'."
}

if (-not (Test-Path $venvPython)) {
    throw "Python da virtualenv não encontrado em '$venvPython'. Crie a venv em '.venv' antes de executar."
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    throw "O comando 'pnpm' não está disponível no PATH."
}

New-Item -ItemType Directory -Path $stateDir -Force | Out-Null

$backendCommand = "Set-Location '$backendPath'; & '$venvPython' app.py"
$frontendCommand = "Set-Location '$frontendPath'; pnpm dev"

if ($NoNewWindows) {
    $backendProcess = Start-Process -FilePath $venvPython -ArgumentList "app.py" -WorkingDirectory $backendPath -PassThru
    $frontendProcess = Start-Process -FilePath "pnpm.cmd" -ArgumentList "dev" -WorkingDirectory $frontendPath -PassThru
} else {
    $backendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $backendCommand -WorkingDirectory $backendPath -PassThru
    $frontendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $frontendCommand -WorkingDirectory $frontendPath -PassThru
}

$processInfo = [ordered]@{
    startedAt = (Get-Date).ToString("o")
    backendPid = $backendProcess.Id
    frontendPid = $frontendProcess.Id
    noNewWindows = [bool]$NoNewWindows
}

$processInfo | ConvertTo-Json | Set-Content -Path $pidFile -Encoding UTF8

Write-Host "Backend iniciado (PID $($backendProcess.Id))."
Write-Host "Frontend iniciado (PID $($frontendProcess.Id))."
# Write-Host "Para encerrar ambos com um comando, execute: .\stop-dev.ps1"