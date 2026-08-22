@echo off
chcp 65001 > nul
echo ========================================
echo    ОБНОВЛЕНИЕ reverseX ПРОЕКТА
echo ========================================
echo.

echo Шаг 1: Проверяем изменения в проекте...
git status
echo.

echo Шаг 2: Добавляем все файлы в коммит...
git add .
echo.

echo Шаг 3: Создаем коммит с текущей датой...
git commit -m "Update reverseX: %date% %time%"
echo.

echo Шаг 4: Отправляем изменения на GitHub...
git push origin main
echo.

echo ========================================
echo    УСПЕШНО ЗАВЕРШЕНО!
echo ========================================
echo.
echo Ваши изменения отправлены в GitHub!
echo.
echo Vercel автоматически обновит ваш сайт:
echo https://reverse-x-git-main-zhandos-projects-6c5c8cfb.vercel.app
echo.
echo Обычно обновление занимает 1-3 минуты.
echo.
pause