param(
    [switch]$NoNewWindows
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"
$venvPython = Join-Path $projectRoot ".venv\Scripts\python.exe"

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

$backendCommand = '$env:RATE_MOVIE_APP_DEV_ROLE=''backend''; Set-Location ''{0}''; & ''{1}'' app.py' -f $backendPath, $venvPython
$frontendCommand = '$env:RATE_MOVIE_APP_DEV_ROLE=''frontend''; Set-Location ''{0}''; pnpm dev' -f $frontendPath

if ($NoNewWindows) {
    $backendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-WindowStyle", "Hidden", "-Command", $backendCommand -WorkingDirectory $backendPath -PassThru
    $frontendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-WindowStyle", "Hidden", "-Command", $frontendCommand -WorkingDirectory $frontendPath -PassThru
} else {
    $backendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $backendCommand -WorkingDirectory $backendPath -PassThru
    $frontendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $frontendCommand -WorkingDirectory $frontendPath -PassThru
}

Write-Host "Backend iniciado (PID $($backendProcess.Id))."
Write-Host "Frontend iniciado (PID $($frontendProcess.Id))."
# Write-Host "Para encerrar ambos com um comando, execute: .\stop-dev.cmd"