# 📋 Файлы для APK сборки

## Главные файлы конфигурации:

| Файл | Назначение |
|------|-----------|
| `capacitor.config.json` | JSON конфигурация Capacitor |
| `capacitor.config.ts` | TypeScript конфигурация Capacitor |

## React компоненты:

| Файл | Назначение |
|------|-----------|
| `src/AppCapacitor.tsx` | Компонент приложения для Capacitor |
| `src/SimpleApp.tsx` | Альтернативный простой компонент |

## Скрипты сборки:

| Файл | ОС | Назначение |
|------|----|---------  |
| `build-apk.bat` | Windows | Полная сборка APK одной командой |
| `build-apk.sh` | macOS/Linux | Полная сборка APK одной командой |

## Документация:

| Файл | Содержание |
|------|-----------|
| `README_APK.md` | Быстрый старт (английский) |
| `APK_SETUP_COMPLETE.md` | Полный отчет о готовности |
| `CAPACITOR_BUILD_GUIDE.md` | Подробная инструкция на русском |
| `ШПАРГАЛКА_APK.md` | Быстрая справка на русском |

## Android проект:

| Директория | Содержание |
|-----------|-----------|
| `android/` | Полный Android проект Gradle |
| `android/app/` | Приложение |
| `android/app/src/main/` | Исходные файлы |
| `android/app/src/main/assets/public/` | Веб-файлы приложения |

## npm скрипты (в package.json):

```json
{
  "cap:init": "capacitor init",
  "cap:add:android": "capacitor add android",
  "cap:build": "npm run build && capacitor build android",
  "cap:sync": "npm run build && capacitor sync android",
  "cap:open": "capacitor open android"
}
```

## Зависимости (добавлены):

```json
{
  "@capacitor/core": "^8.0.1",
  "@capacitor/cli": "^8.0.1",
  "@capacitor/android": "^8.0.1"
}
```

---

## 🎯 Процесс сборки:

1. **Windows скрипт** `build-apk.bat` выполняет:
   - ✓ Проверка Java
   - ✓ Проверка Android SDK
   - ✓ Сборка React приложения (`npm run build`)
   - ✓ Синхронизация с Capacitor (`npx cap sync android`)
   - ✓ Сборка APK через Gradle (`gradlew build`)

2. **Результат**:
   - Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📱 Что загружается в приложение:

**Основной URL**: `https://reversex.vercel.app/`

**Разрешения**:
- ✅ Интернет
- ✅ Геолокация
- ✅ Камера
- ✅ Микрофон
- ✅ Хранилище файлов

---

## ✅ Все готово для сборки!

### Быстрый старт:
```bash
cd c:\Users\zhandos\Downloads\reverseX-main
build-apk.bat
```

**Результат**: APK файл в `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📚 Документация:

- **Быстро**: Смотри `ШПАРГАЛКА_APK.md`
- **Подробно**: Смотри `CAPACITOR_BUILD_GUIDE.md`
- **Отчет**: Смотри `APK_SETUP_COMPLETE.md`
