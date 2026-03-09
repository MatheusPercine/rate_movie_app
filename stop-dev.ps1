$ErrorActionPreference = "Stop"

$roleMarkers = @(
    "RATE_MOVIE_APP_DEV_ROLE='backend'",
    "RATE_MOVIE_APP_DEV_ROLE='frontend'"
)

function Get-ManagedProcessIds {
    $managedProcesses = Get-CimInstance Win32_Process | Where-Object {
        $commandLine = $_.CommandLine
        $commandLine -and ($roleMarkers | Where-Object { $commandLine.Contains($_) })
    }

    @($managedProcesses | Select-Object -ExpandProperty ProcessId -Unique)
}

function Stop-ProcessTree {
    param(
        [int]$RootProcessId
    )

    $childProcessIds = @(Get-CimInstance Win32_Process | Where-Object {
        $_.ParentProcessId -eq $RootProcessId
    } | Select-Object -ExpandProperty ProcessId)

    foreach ($childProcessId in $childProcessIds) {
        Stop-ProcessTree -RootProcessId $childProcessId
    }

    $process = Get-Process -Id $RootProcessId -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $RootProcessId -Force -ErrorAction SilentlyContinue
        if (-not (Get-Process -Id $RootProcessId -ErrorAction SilentlyContinue)) {
            Write-Host "Processo $RootProcessId encerrado."
        }
    }
}

$processIds = Get-ManagedProcessIds

if (-not $processIds -or $processIds.Count -eq 0) {
    Write-Host "Nenhum processo iniciado por .\dev.cmd foi encontrado."
    exit 0
}

foreach ($processId in $processIds) {
    Stop-ProcessTree -RootProcessId $processId
}

Write-Host "Launcher finalizado."