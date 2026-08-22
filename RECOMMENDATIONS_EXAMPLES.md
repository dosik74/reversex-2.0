// ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ - Система Рекомендаций

// ============================================
// 1. ПОЛУЧЕНИЕ РЕКОМЕНДАЦИЙ
// ============================================

import { getRecommendations, getRecommendationById } from '@/services/recommendationService';

// Пример 1: Получить первую страницу
async function loadFirstPage() {
  try {
    const result = await getRecommendations(1, 10);
    console.log('Всего рекомендаций:', result.total);
    console.log('Рекомендации:', result.data);
    console.log('Текущая страница:', result.page);
  } catch (error) {
    console.error('Ошибка загрузки:', error);
  }
}

// Пример 2: Получить конкретную рекомендацию
async function loadSingleRecommendation() {
  const id = 'recommendation-uuid-here';
  try {
    const rec = await getRecommendationById(id);
    console.log('Заголовок:', rec.title);
    console.log('Автор:', rec.author?.user_metadata?.full_name);
    console.log('Количество лайков:', rec.likes_count);
  } catch (error) {
    console.error('Ошибка:', error);
  }
}


// ============================================
// 2. СОЗДАНИЕ РЕКОМЕНДАЦИИ
// ============================================

import { createRecommendation } from '@/services/recommendationService';

// Пример 1: Простая рекомендация без файлов
async function createSimpleRecommendation() {
  try {
    const rec = await createRecommendation(
      'Лучший фильм года',
      'Просто бомба! Отличная история и актеры.'
    );
    console.log('Создано!', rec.id);
  } catch (error) {
    console.error('Ошибка создания:', error);
  }
}

// Пример 2: Рекомендация с файлами
async function createWithFiles() {
  // Предположим у нас есть файлы из input[type=file]
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  const files = Array.from(fileInput.files || []);

  try {
    const rec = await createRecommendation(
      'Отличный сериал',
      'Смотрел весь сезон за день!',
      files
    );
    console.log('Создано с файлами!', rec.id);
    console.log('Медиа загружены:', rec.media?.length);
  } catch (error) {
    console.error('Ошибка:', error);
  }
}


// ============================================
// 3. РАБОТА С ФАЙЛАМИ
// ============================================

import { uploadRecommendationMedia } from '@/services/recommendationService';

async function uploadMedia() {
  const recommendationId = 'existing-recommendation-id';
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  const files = Array.from(fileInput.files || []);

  try {
    const uploaded = await uploadRecommendationMedia(recommendationId, files);
    console.log('Загружено файлов:', uploaded.length);
    
    // Получить URL-ы
    uploaded.forEach(file => {
      console.log('Файл:', file.name, 'Path:', file.path);
    });
  } catch (error) {
    console.error('Ошибка загрузки:', error);
  }
}


// ============================================
// 4. ЛАЙКИ И ДИЗЛАЙКИ
// ============================================

import { 
  likeRecommendation, 
  unlikeRecommendation,
  getRecommendationLikesCount,
  isRecommendationLikedByUser 
} from '@/services/recommendationService';

// Пример 1: Лайкнуть пост
async function likePost() {
  const recommendationId = 'post-id';
  try {
    await likeRecommendation(recommendationId);
    console.log('Лайкнул!');
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

// Пример 2: Убрать лайк
async function unlikePost() {
  const recommendationId = 'post-id';
  try {
    await unlikeRecommendation(recommendationId);
    console.log('Лайк убран!');
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

// Пример 3: Получить количество лайков
async function checkLikes() {
  const recommendationId = 'post-id';
  try {
    const count = await getRecommendationLikesCount(recommendationId);
    console.log('Лайков:', count);
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

// Пример 4: Проверить, лайкнул ли я этот пост
async function checkIfLiked() {
  const recommendationId = 'post-id';
  try {
    const isLiked = await isRecommendationLikedByUser(recommendationId);
    if (isLiked) {
      console.log('Я уже лайкнул этот пост');
    } else {
      console.log('Еще не лайкнул');
    }
  } catch (error) {
    console.error('Ошибка:', error);
  }
}


// ============================================
// 5. РАБОТА С ОТВЕТАМИ/КОММЕНТАРИЯМИ
// ============================================

import { 
  addReplyToRecommendation,
  getRecommendationReplies,
  getRecommendationRepliesCount,
  deleteReply 
} from '@/services/recommendationService';

// Пример 1: Добавить ответ
async function addReply() {
  const recommendationId = 'post-id';
  const content = 'Согласен! Отличный выбор.';

  try {
    const reply = await addReplyToRecommendation(recommendationId, content);
    console.log('Ответ добавлен!', reply.id);
    console.log('Автор:', reply.author?.user_metadata?.full_name);
  } catch (error) {
    console.error('Ошибка добавления ответа:', error);
  }
}

// Пример 2: Получить все ответы
async function loadReplies() {
  const recommendationId = 'post-id';
  try {
    const replies = await getRecommendationReplies(recommendationId);
    console.log('Ответов:', replies.length);
    replies.forEach(reply => {
      console.log('От:', reply.author?.user_metadata?.full_name);
      console.log('Текст:', reply.content);
    });
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

// Пример 3: Получить количество ответов
async function checkReplyCount() {
  const recommendationId = 'post-id';
  try {
    const count = await getRecommendationRepliesCount(recommendationId);
    console.log('Всего ответов:', count);
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

// Пример 4: Удалить свой ответ
async function deleteMyReply() {
  const replyId = 'reply-uuid';
  try {
    await deleteReply(replyId);
    console.log('Ответ удален!');
  } catch (error) {
    console.error('Ошибка удаления:', error);
  }
}


// ============================================
// 6. УДАЛЕНИЕ РЕКОМЕНДАЦИИ
// ============================================

import { deleteRecommendation } from '@/services/recommendationService';

async function deleteMyRecommendation() {
  const recommendationId = 'my-post-id';
  
  // Обычно добавляем подтверждение
  if (!confirm('Вы уверены, что хотите удалить эту рекомендацию?')) {
    return;
  }

  try {
    await deleteRecommendation(recommendationId);
    console.log('Рекомендация удалена!');
    // Обновляем список
    // ... код для обновления UI
  } catch (error) {
    console.error('Ошибка удаления:', error);
  }
}


// ============================================
// 7. ИСПОЛЬЗОВАНИЕ В REACT КОМПОНЕНТАХ
// ============================================

import { useEffect, useState } from 'react';

function MyRecommendationsComponent() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function loadRecommendations() {
    try {
      setLoading(true);
      const result = await getRecommendations(1, 10);
      setRecommendations(result.data);
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(recId: string) {
    try {
      await likeRecommendation(recId);
      // Обновляем локально
      setRecommendations(prev =>
        prev.map(rec =>
          rec.id === recId
            ? { ...rec, likes_count: (rec.likes_count || 0) + 1 }
            : rec
        )
      );
    } catch (error) {
      console.error('Ошибка лайка:', error);
    }
  }

  async function handleDeleteRecommendation(recId: string) {
    if (!confirm('Удалить?')) return;

    try {
      await deleteRecommendation(recId);
      setRecommendations(prev => prev.filter(rec => rec.id !== recId));
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  }

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      {recommendations.map(rec => (
        <div key={rec.id}>
          <h3>{rec.title}</h3>
          <p>{rec.content}</p>
          <p>Лайков: {rec.likes_count}</p>
          <button onClick={() => handleLike(rec.id)}>Лайк</button>
          <button onClick={() => handleDeleteRecommendation(rec.id)}>
            Удалить
          </button>
        </div>
      ))}
    </div>
  );
}


// ============================================
// 8. ПОЛУЧЕНИЕ ИНФОРМАЦИИ ОБ АВТОРЕ
// ============================================

import { getUserInfo } from '@/services/recommendationService';

async function displayAuthorInfo() {
  const userId = 'some-user-id';
  try {
    const author = await getUserInfo(userId);
    console.log('Email:', author.email);
    console.log('Имя:', author.user_metadata?.full_name);
    console.log('Аватар:', author.user_metadata?.avatar_url);
  } catch (error) {
    console.error('Ошибка получения информации:', error);
  }
}


// ============================================
// 9. ОБНОВЛЕНИЕ РЕКОМЕНДАЦИИ
// ============================================

import { updateRecommendation } from '@/services/recommendationService';

async function editMyRecommendation() {
  const recommendationId = 'my-post-id';
  const newTitle = 'Новый заголовок';
  const newContent = 'Новое описание с улучшениями';

  try {
    const success = await updateRecommendation(
      recommendationId,
      newTitle,
      newContent
    );
    if (success) {
      console.log('Рекомендация обновлена!');
    }
  } catch (error) {
    console.error('Ошибка обновления:', error);
  }
}


// ============================================
// 10. ПОЛНЫЙ ПРИМЕР: КОМПОНЕНТ С ФОРМОЙ
// ============================================

import React, { useState } from 'react';

function RecommendationForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация
    if (!title.trim() || !content.trim()) {
      setError('Заполните все поля');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Создание рекомендации
      const rec = await createRecommendation(
        title,
        content,
        files.length > 0 ? files : undefined
      );

      console.log('Рекомендация создана!', rec.id);

      // Очистка формы
      setTitle('');
      setContent('');
      setFiles([]);

      // Можно вызвать callback для обновления списка
      // onSuccess?.();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <label>Заголовок:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Введите заголовок"
          disabled={loading}
        />
      </div>

      <div>
        <label>Описание:</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Поделитесь своей рекомендацией"
          disabled={loading}
          rows={5}
        />
      </div>

      <div>
        <label>Добавить файлы:</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={loading}
        />
        {files.length > 0 && (
          <ul>
            {files.map((file, idx) => (
              <li key={idx}>{file.name}</li>
            ))}
          </ul>
        )}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Загрузка...' : 'Поделиться'}
      </button>
    </form>
  );
}

export default RecommendationForm;


// ============================================
// 11. ОБРАБОТКА ОШИБОК
// ============================================

async function handleErrors() {
  try {
    const result = await getRecommendations(1, 10);
    console.log(result);
  } catch (error) {
    // Проверяем тип ошибки
    if (error instanceof Error) {
      console.error('Ошибка:', error.message);
    } else {
      console.error('Неизвестная ошибка:', error);
    }

    // Обработка специфичных ошибок
    if ((error as any).status === 401) {
      console.log('Не авторизован');
      // Перенаправить на страницу логина
    } else if ((error as any).status === 403) {
      console.log('Доступ запрещен');
    } else if ((error as any).status === 404) {
      console.log('Не найдено');
    }
  }
}

---

// СОВЕТЫ И ТРЮКИ

// 1. Кэширование результатов
let cachedRecommendations: any[] = [];
async function getCachedRecommendations() {
  if (cachedRecommendations.length > 0) {
    return cachedRecommendations;
  }
  const result = await getRecommendations(1, 10);
  cachedRecommendations = result.data;
  return cachedRecommendations;
}

// 2. Оптимистичные обновления
async function optimisticLike(recId: string) {
  // Сразу обновляем UI
  setRecommendations(prev =>
    prev.map(rec =>
      rec.id === recId
        ? { ...rec, likes_count: rec.likes_count + 1, is_liked_by_user: true }
        : rec
    )
  );

  try {
    // Затем отправляем на сервер
    await likeRecommendation(recId);
  } catch (error) {
    // Если ошибка - откатываем
    setRecommendations(prev =>
      prev.map(rec =>
        rec.id === recId
          ? { ...rec, likes_count: rec.likes_count - 1, is_liked_by_user: false }
          : rec
      )
    );
  }
}

// 3. Pagination с загрузкой по мере прокрутки
async function loadMoreOnScroll() {
  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
      // Загружаем следующую страницу
      setCurrentPage(prev => prev + 1);
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}

// 4. Отладка Supabase запросов
import supabase from '@/lib/supabase';

async function debugSupabase() {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .limit(1);

  console.log('Data:', data);
  console.log('Error:', error);
}
