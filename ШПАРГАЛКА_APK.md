# 🚀 Шпаргалка по сборке APK

## Самый быстрый вариант (если уже установлены Java и Android SDK):

```bash
# 1. В директории проекта
cd c:\Users\zhandos\Downloads\reverseX-main

# 2. Запустить Windows скрипт
build-apk.bat
```

**Готово!** APK будет в: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Если Java или Android SDK не установлены:

### 1️⃣ Установить Java
- Скачать: https://www.oracle.com/java/technologies/downloads/
- Выбрать Windows x64 Installer
- Установить (обычно в `C:\Program Files\Java\jdkXX`)

### 2️⃣ Установить Android SDK
- **Вариант А (Рекомендуется)**: Скачать Android Studio
  - https://developer.android.com/studio
  - Установить, SDK автоматически установится

- **Вариант Б**: Скачать SDK отдельно
  - https://developer.android.com/studio#command-tools

### 3️⃣ Установить переменные окружения

Открыть **Параметры среды Windows**:
1. Нажать `Win + X` → **Параметры системы**
2. **Дополнительные параметры системы**
3. **Переменные среды**
4. Добавить новые переменные:

| Переменная | Значение |
|-----------|----------|
| `JAVA_HOME` | `C:\Program Files\Java\jdk-21` |
| `ANDROID_HOME` | `C:\Users\USERNAME\AppData\Local\Android\Sdk` |

Добавить в переменную `Path`:
- `%JAVA_HOME%\bin`
- `%ANDROID_HOME%\tools\bin`

### 4️⃣ Перезагрузиться и запустить сборку:

```bash
build-apk.bat
```

---

## Проверка установки:

```bash
# Проверить Java
java -version

# Проверить Android SDK
echo %ANDROID_HOME%

# Проверить что все готово
cd android
gradlew --version
```

---

## Если сборка не работает:

```bash
# Очистить кэш Gradle
cd android
gradlew clean
cd ..

# Обновить зависимости
npm install
npx cap update android

# Попробовать снова
npm run cap:sync
```

---

## Все команды:

| Команда | Что делает |
|---------|-----------|
| `npm run build` | Собрать React приложение |
| `npm run cap:sync` | Синхронизировать с Android |
| `npm run cap:build` | Полная сборка APK |
| `npm run cap:open` | Открыть в Android Studio |
| `build-apk.bat` | Все в одной команде (Windows) |

---

## Где найти APK после сборки:

```
📁 android
   └─ 📁 app
      └─ 📁 build
         └─ 📁 outputs
            └─ 📁 apk
               └─ 📁 debug
                  └─ 📄 app-debug.apk  ← ВОТ ЭТОТ!
```

---

## Установка на телефон:

1. Включить разработчика режим на телефоне:
   - **Параметры → О телефоне → Номер сборки** (нажать 7 раз)

2. Включить USB отладку:
   - **Параметры → Для разработчиков → Отладка по USB**

3. Подключить телефон USB кабелем

4. Установить:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Контакты при ошибках:

1. Проверить Java: `java -version`
2. Проверить SDK: переменная `ANDROID_HOME`
3. Попробовать очистить: `cd android && gradlew clean && cd ..`
4. Переустановить зависимости: `npm install`
5. Открыть в Android Studio и собрать оттуда

---

**✨ Готово! Приложение ReverseX будет на телефоне!**
