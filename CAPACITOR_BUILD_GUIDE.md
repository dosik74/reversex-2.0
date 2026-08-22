# Как собрать APK файл для ReverseX

## Требования:
1. **Java Development Kit (JDK)** - версия 11+
   - Скачать: https://www.oracle.com/java/technologies/downloads/

2. **Android SDK**
   - Скачать Android Studio: https://developer.android.com/studio
   - Или скачать Android SDK Command-line tools

3. **Node.js и npm** - уже установлены

## Пошаговая инструкция:

### Шаг 1: Установка Java
```bash
# Проверить установку Java
java -version
```

### Шаг 2: Установка Android SDK
```bash
# Если используется Android Studio, SDK уже установлен
# Если используется Command-line tools, установить через:
sdkmanager --sdk_root=C:\Android\sdk "platforms;android-34"
sdkmanager --sdk_root=C:\Android\sdk "build-tools;34.0.0"
sdkmanager --sdk_root=C:\Android\sdk "ndk;26.1.10909125"
```

### Шаг 3: Установка переменных окружения
```bash
# Добавить в переменные окружения:
JAVA_HOME = путь к JDK (например: C:\Program Files\Java\jdk-21)
ANDROID_HOME = путь к Android SDK (например: C:\Users\<ваше имя>\AppData\Local\Android\Sdk)
```

### Шаг 4: Синхронизация проекта
```bash
cd c:\Users\zhandos\Downloads\reverseX-main
npm run cap:sync
```

### Шаг 5: Открыть в Android Studio (рекомендуется)
```bash
npm run cap:open
```

Это откроет проект в Android Studio. Затем:
1. Нажать **Build** в меню
2. Выбрать **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Дождаться завершения
4. APK файл будет в `android/app/build/outputs/apk/debug/`

### Шаг 6: Прямая сборка (без GUI)
```bash
cd android
gradlew build
```

## Результат:
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `android/app/build/outputs/apk/release/app-release.apk` (требует подписания)

## Установка на устройство:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Скрипты npm:
```bash
npm run cap:sync    # Синхронизировать код и собрать
npm run cap:build   # Собрать в Android Studio
npm run cap:open    # Открыть проект в Android Studio
```

## Поддерживаемые функции:
- Отображение сайта https://reversex.vercel.app/
- Геолокация (если требуется)
- Камера и микрофон (если требуется)
- Платежи (если требуется)
- Обработка кнопки Back на Android

## Примечания:
- Первая сборка займет 5-10 минут (загрузка зависимостей Gradle)
- Debug APK больше и медленнее, но не требует подписания
- Для Release APK нужно создать и подписать сертификатом
