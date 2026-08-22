@echo off
setlocal enabledelayedexpansion

REM Установка Java 21
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot"
set "Path=!JAVA_HOME!\bin;!Path!"

REM Проверка Java
echo Проверка Java версии:
java -version

REM Переход в папку Android
cd /d c:\Users\zhandos\Downloads\reverseX-main

REM Синхронизация
echo.
echo Синхронизация с Android...
call npx cap sync android

REM Сборка APK
echo.
echo Сборка APK...
cd /d c:\Users\zhandos\Downloads\reverseX-main\android
call gradlew :app:assembleDebug --build-cache -x lintVitalRelease

REM Проверка результата
echo.
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo ✅ АПК ГОТОВ!
    for %%F in (app\build\outputs\apk\debug\app-debug.apk) do (
        echo Путь: %%~fF
        echo Размер: %%~zF байт
    )
) else (
    echo ❌ АПК не создан
)
