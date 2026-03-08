$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $projectRoot ".run\dev-processes.json"

if (-not (Test-Path $pidFile)) {
    Write-Host "Nenhum processo registrado em '$pidFile'."
    exit 0
}

$processInfo = Get-Content -Path $pidFile -Raw | ConvertFrom-Json
$processIds = @($processInfo.backendPid, $processInfo.frontendPid) | Where-Object { $_ }

foreach ($processId in $processIds) {
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $processId -Force
        Write-Host "Processo $processId encerrado."
    }
}

Remove-Item $pidFile -Force
Write-Host "Launcher finalizado."