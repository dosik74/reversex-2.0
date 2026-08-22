#!/usr/bin/env bash
# Скрипт для проверки и сборки APK (macOS/Linux)

echo "======================================"
echo "   ReverseX APK Builder"
echo "======================================"

# Проверка Java
echo ""
echo "📋 Проверка Java..."
if ! command -v java &> /dev/null; then
    echo "❌ Java не установлена!"
    echo "📥 Скачайте JDK: https://www.oracle.com/java/technologies/downloads/"
    exit 1
fi
java -version

# Проверка Android SDK
echo ""
echo "📋 Проверка Android SDK..."
if [ -z "$ANDROID_HOME" ]; then
    echo "❌ Переменная ANDROID_HOME не установлена!"
    exit 1
fi
echo "✓ ANDROID_HOME = $ANDROID_HOME"

# Сборка React приложения
echo ""
echo "🔨 Сборка React приложения..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Ошибка при сборке React!"
    exit 1
fi
echo "✓ React приложение собрано"

# Синхронизация с Capacitor
echo ""
echo "🔄 Синхронизация с Capacitor..."
npx cap sync android
if [ $? -ne 0 ]; then
    echo "❌ Ошибка синхронизации!"
    exit 1
fi
echo "✓ Синхронизация завершена"

# Сборка APK
echo ""
echo "📦 Сборка APK..."
cd android
./gradlew build
if [ $? -ne 0 ]; then
    echo "❌ Ошибка при сборке APK!"
    cd ..
    exit 1
fi
cd ..

# Успех
echo ""
echo "======================================"
echo "✅ APK успешно собран!"
echo "======================================"
echo ""
echo "📍 Путь к Debug APK:"
echo "   android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "📲 Для установки выполните:"
echo "   adb install android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
