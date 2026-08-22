# Скрипт сборки APK с красивым индикатором прогресса

$projectPath = "c:\Users\zhandos\Downloads\reverseX-main"
$apkPath = "$projectPath\android\app\build\outputs\apk\debug\app-debug.apk"

Clear-Host

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         ReverseX APK BUILD TOOL           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Запуск сборки APK..." -ForegroundColor Green
Write-Host ""

# Запускаем батник
$batProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "build-apk.bat" -WorkingDirectory $projectPath -NoNewWindow -PassThru

Write-Host "⏳ Ожидаем завершения сборки..." -ForegroundColor Yellow
Write-Host ""

$spinners = @('|', '/', '-', '\')
$seconds = 0

# Показываем индикатор пока сборка идёт
while (-not $batProcess.HasExited) {
    $spinner = $spinners[$seconds % 4]
    $minutes = [int]($seconds / 60)
    $secs = $seconds % 60
    $timeStr = "{0:D2}:{1:D2}" -f $minutes, $secs
    
    Write-Host "`r$spinner Компилирование APK... [$timeStr]" -ForegroundColor Magenta -NoNewline
    
    Start-Sleep -Milliseconds 500
    $seconds += 0.5
    
    # Проверяем есть ли уже APK каждые 5 секунд
    if ($seconds % 5 -lt 1 -and (Test-Path $apkPath)) {
        Write-Host ""
        break
    }
}

Write-Host ""
Write-Host ""

# Проверяем результат
if (Test-Path $apkPath) {
    $size = (Get-Item $apkPath).Length / 1MB
    $size = [math]::Round($size, 2)
    
    Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║          ✅ APK УСПЕШНО СОБРАН! ✅        ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Информация об APK:" -ForegroundColor Cyan
    Write-Host "   Путь: $apkPath" -ForegroundColor Green
    Write-Host "   Размер: $size MB" -ForegroundColor Green
    Write-Host ""
    Write-Host "📲 Для установки на устройство выполните:" -ForegroundColor Yellow
    Write-Host "   adb install ""$apkPath""" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 Готово!" -ForegroundColor Green
} else {
    Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║           ❌ ОШИБКА ПРИ СБОРКЕ! ❌        ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Host "❌ APK не был создан." -ForegroundColor Red
}
