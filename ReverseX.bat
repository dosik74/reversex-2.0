@echo off
setlocal DisableDelayedExpansion
set "RX_LAUNCHER=%~f0"
set "RX_OPTION=%~1"
powershell.exe -NoLogo -NoProfile -Command "$s=[IO.File]::ReadAllText($env:RX_LAUNCHER); & ([scriptblock]::Create(($s -split '(?m)^# POWERSHELL\r?$',2)[1]))"
if not errorlevel 1 exit /b 0
pause
exit /b 1

# POWERSHELL
$ErrorActionPreference = 'Stop'
$project = Split-Path -LiteralPath $env:RX_LAUNCHER
$vite = Join-Path $project 'node_modules\vite\bin\vite.js'
$hash = [BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash(
    [Text.Encoding]::UTF8.GetBytes($project.ToLowerInvariant()))).Replace('-', '').Substring(0, 16)
$mutex = [Threading.Mutex]::new($false, "Local\ReverseX-$hash")
$locked = $false
try {
    try { $locked = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $locked = $true }
    if (-not $locked) { Write-Host 'Запуск или остановка уже выполняется.'; exit 0 }
    Set-Location -LiteralPath $project

    # Match this checkout's Vite entry point, including a server started before this launcher.
    $entry = [regex]::Escape($vite)
    $command = '^\s*(?:"[^"]+"|\S+)\s+(?:"' + $entry + '"|' + $entry + ')(?:\s|$)'
    $servers = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {
        ($_.CommandLine -replace '/', '\') -match $command
    })
    $listeners = [Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners()
    if ($servers.Count) {
        $owners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess)
        $running = @($servers | Where-Object { $owners -contains $_.ProcessId })
        if ($running.Count) {
            foreach ($server in $running) {
                $process = Get-Process -Id $server.ProcessId -ErrorAction SilentlyContinue
                if ($process -and [Math]::Abs(($process.StartTime - $server.CreationDate).TotalSeconds) -lt 1) {
                    $process.Kill()
                    if (-not $process.WaitForExit(5000)) { throw 'Не удалось остановить сервер сайта.' }
                }
            }
            Write-Host 'Сайт остановлен.'
            exit 0
        }
    }

    $node = Get-Command node.exe -ErrorAction SilentlyContinue
    if (-not $node) { throw 'Для запуска сайта установите Node.js с npm.' }
    if (-not (Test-Path -LiteralPath $vite)) {
        Write-Host 'Установка зависимостей проекта...'
        & npm.cmd ci --legacy-peer-deps --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'Не удалось установить зависимости. Проверьте вывод npm выше.' }
    }
    $port = 5173
    while ($listeners.Port -contains $port) { $port++ }
    $url = "http://127.0.0.1:$port/"
    $log = Join-Path ([IO.Path]::GetTempPath()) "reversex-$hash"
    $server = Start-Process -FilePath $node.Source -WorkingDirectory $project -WindowStyle Hidden -PassThru `
        -ArgumentList @('"' + $vite + '"', '--host', '127.0.0.1', '--port', $port, '--strictPort') `
        -RedirectStandardOutput "$log.out.log" -RedirectStandardError "$log.err.log"
    $ready = $false
    $timer = [Diagnostics.Stopwatch]::StartNew()
    while (-not $server.HasExited -and $timer.Elapsed.TotalSeconds -lt 45) {
        try {
            $ready = (Invoke-WebRequest -UseBasicParsing -Uri ($url + '@vite/client') -TimeoutSec 2).StatusCode -eq 200
        } catch { }
        if ($ready) { break }
        Start-Sleep -Milliseconds 200
    }
    if (-not $ready -or $server.HasExited) {
        if (-not $server.HasExited) { $server.Kill() }
        throw "Сайт не запустился. Журнал ошибок: $log.err.log"
    }
    Write-Host "Сайт запущен: $url"
    if ($env:RX_OPTION -ne '--no-browser') { Start-Process $url }
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
} finally {
    if ($locked) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
