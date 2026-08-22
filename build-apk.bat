@echo off
REM Скрипт для сборки APK файла ReverseX

echo ===================================
echo    Сборка APK для ReverseX
echo ===================================

REM Установка Java 11
echo.
echo Установка Java 17 в переменные окружения...
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.17+10-hotspot
set Path=%JAVA_HOME%\bin;%Path%

REM Проверка Java
echo.
echo Проверка Java...
java -version
if errorlevel 1 (
    echo ОШИБКА: Java не установлена!
    echo Скачайте JDK: https://www.oracle.com/java/technologies/downloads/
    exit /b 1
)

REM Проверка Android SDK и установка переменной
echo.
echo Проверка Android SDK...
if not defined ANDROID_HOME (
    echo Попытка установить ANDROID_HOME автоматически...
    if exist "%USERPROFILE%\AppData\Local\Android\Sdk" (
        set ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk
        echo ✓ ANDROID_HOME установлена: %ANDROID_HOME%
    ) else (
        echo ОШИБКА: Переменная ANDROID_HOME не установлена!
        echo Установите Android Studio или скачайте Android SDK
        exit /b 1
    )
) else (
    echo ✓ ANDROID_HOME: %ANDROID_HOME%
)

REM Сборка проекта
echo.
echo Сборка React приложения...
call npm run build
if errorlevel 1 (
    echo ОШИБКА при сборке React!
    exit /b 1
)

REM Синхронизация с Capacitor
echo.
echo Синхронизация с Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo ОШИБКА при синхронизации Capacitor!
    exit /b 1
)

REM Сборка APK
echo.
echo Сборка APK (Debug)...
echo.
cd android

REM Запускаем сборку с индикатором прогресса
.\gradlew.bat build > build.log 2>&1 &
set GRADLE_PID=%ERRORLEVEL%

REM Показываем индикатор загрузки
setlocal enabledelayedexpansion
set "spinner=|/-\"
set counter=0

:wait_loop
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo ✓ APK готов!
    goto done_build
)

REM Проверим жив ли процесс gradle
tasklist | findstr /i "gradle" > nul
if %ERRORLEVEL% neq 0 (
    REM Процесс завершился, ждём немного и проверяем результат
    timeout /t 2 /nobreak > nul
    if exist "app\build\outputs\apk\debug\app-debug.apk" (
        echo.
        echo ✓ APK готов!
        goto done_build
    ) else (
        echo.
        echo ОШИБКА при сборке APK!
        type build.log | findstr /i "FAILURE ERROR"
        cd ..
        exit /b 1
    )
)

REM Показываем спиннер
set /a counter+=1
set /a spinner_index=counter%%4
for /f %%i in ('echo prompt $H ^| cmd') do set "BS=%%i"
cls
echo.
echo Сборка APK (Debug)...
echo.
echo !spinner:~!spinner_index!,1! Компилирование... (!counter! сек)
echo ⏳ Пожалуйста подождите...
echo.

timeout /t 1 /nobreak > nul
goto wait_loop

:done_build
cd ..

echo.
echo ===================================
echo    ✓ APK успешно собран!
echo ===================================
echo.
echo Debug APK находится в:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo.
if errorlevel 1 (
    echo ОШИБКА при сборке APK!
    exit /b 1
)

REM Успешно
echo.
echo ===================================
echo    ✓ APK успешно собран!
echo ===================================
echo.
echo Debug APK находится в:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Для установки на устройство выполните:
echo adb install android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
