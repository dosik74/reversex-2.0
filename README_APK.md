# ReverseX Mobile App (Capacitor APK)

Мобильное приложение для Android, которое загружает сайт https://reversex.vercel.app/

## Быстрый старт

### Требования:
- Java JDK 11+ 
- Android SDK (через Android Studio)
- Node.js 16+

### Сборка APK:

#### Способ 1: Автоматический скрипт (Windows)
```bash
build-apk.bat
```

#### Способ 2: Вручную
```bash
# 1. Синхронизировать код с Capacitor
npm run cap:sync

# 2. Открыть в Android Studio
npm run cap:open

# 3. В Android Studio: Build → Build APK(s)
```

#### Способ 3: Через Gradle (командная строка)
```bash
npm run build
npx cap sync android
cd android
gradlew build
cd ..
```

### Результат:
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk` (~50-80 MB)
- **Установка**: `adb install android/app/build/outputs/apk/debug/app-debug.apk`

## Структура проекта

```
├── src/
│   ├── AppCapacitor.tsx      # App компонент для Capacitor
│   ├── SimpleApp.tsx          # Альтернативный простой компонент
│   └── ...
├── android/                   # Android проект (Gradle)
├── dist/                      # Собранные веб-файлы
├── capacitor.config.ts        # Конфигурация Capacitor
├── capacitor.config.json      # Backup конфигурации
├── build-apk.bat             # Скрипт сборки (Windows)
└── CAPACITOR_BUILD_GUIDE.md  # Полная инструкция

```

## npm скрипты

```bash
npm run build            # Собрать React приложение
npm run cap:sync        # Синхронизировать с Android
npm run cap:build       # Полная сборка APK
npm run cap:open        # Открыть в Android Studio
```

## Поддерживаемые функции

✓ Загрузка внешнего сайта  
✓ Геолокация  
✓ Камера и микрофон  
✓ Платежи  
✓ Правильная обработка кнопки Back  

## Первый запуск может занять 5-10 минут (загрузка Gradle зависимостей)

## Помощь

Если возникли проблемы:
1. Проверьте, что установлены Java и Android SDK
2. Добавьте переменные окружения (JAVA_HOME, ANDROID_HOME)
3. Очистите кэш: `npm run build:clean && gradlew clean`
4. Переустановите зависимости: `npm install && npx cap update android`

## Подробная инструкция: [CAPACITOR_BUILD_GUIDE.md](CAPACITOR_BUILD_GUIDE.md)
