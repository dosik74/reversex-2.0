@echo off
setlocal enabledelayedexpansion

REM Установка Java 21
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot"
set "Path=!JAVA_HOME!\bin;!Path!"

echo ✅ Java установлена: %JAVA_HOME%
java -version 2>&1 | findstr /R "version"

cd /d "c:\Users\zhandos\Downloads\reverseX-main"

REM Убедимся что React собран
echo.
echo 🔨 Сборка React приложения...
call npm run build

REM Синхронизируем с Android
echo.
echo 📱 Синхронизация с Android...
call npx cap sync android

REM Чистый Gradle 
cd /d "c:\Users\zhandos\Downloads\reverseX-main\android"
echo.
echo 🗑️  Очистка Gradle...
call gradlew clean

REM Сборка
echo.
echo 🔨 Сборка APK (assembleDebug)...
call gradlew assembleDebug

REM Проверка
cd /d "c:\Users\zhandos\Downloads\reverseX-main"
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo ✅✅✅ АПК УСПЕШНО СОЗДАН!
    echo Путь: %cd%\android\app\build\outputs\apk\debug\app-debug.apk
    for %%F in (android\app\build\outputs\apk\debug\app-debug.apk) do (
        echo Размер: %%~zF байт
    )
) else (
    echo.
    echo ❌ ОШИБКА: АПК не создан
    echo Проверьте логи в android\build.log
)
pause
