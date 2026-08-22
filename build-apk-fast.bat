@echo off
REM Быстрая сборка APK - простой вариант

cd "c:\Users\zhandos\Downloads\reverseX-main"

echo.
echo ╔════════════════════════════════════╗
echo ║   СБОРКА APK (БЫСТРЫЙ ВАРИАНТ)    ║
echo ╚════════════════════════════════════╝
echo.

REM Установка Java 17
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot
set Path=%JAVA_HOME%\bin;%Path%
set ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk

REM Проверка
java -version
if errorlevel 1 exit /b 1

echo ✓ Очистка старых сборок...
cd android
call gradlew clean
echo ✓ Синхронизация...
cd ..
call npx cap sync android

echo ✓ Сборка APK...
cd android
call gradlew :app:assembleDebug --build-cache -x lintVitalRelease

echo.
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo ╔════════════════════════════════════╗
    echo ║    ✅ APK ГОТОВ!                  ║
    echo ╚════════════════════════════════════╝
    echo.
    for %%A in ("app\build\outputs\apk\debug\app-debug.apk") do (
        echo Путь: %%~fA
        echo Размер: %%~zA байт
    )
) else (
    echo ╔════════════════════════════════════╗
    echo ║    ❌ ОШИБКА!                      ║
    echo ╚════════════════════════════════════╝
)

cd ..
pause
