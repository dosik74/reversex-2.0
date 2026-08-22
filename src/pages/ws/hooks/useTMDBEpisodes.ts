import { useState, useEffect } from 'react';
import type { Episode } from '../data/shows';

const API_KEY = 'a981b3ba0b345f578fb917ee74a90bf3';

// Fallback: русские названия -> английские для TMDB search (если ru-RU не находит)
const TITLE_MAP: Record<string, string> = {
  'Во все тяжкие': 'Breaking Bad',
  'Лучше звоните Солу': 'Better Call Saul',
  'Декстер': 'Dexter',
  'Добро пожаловать в Дерри': 'Welcome to Derry',
  'Пацаны': 'The Boys',
  'Аркейн': 'Arcane',
  'Остаться в живых': 'Lost',
  'Мистер Робот': 'Mr. Robot',
  'Игра в кальмара': 'Squid Game',
  'Алиса в Пограничье': 'Alice in Borderland',
  'Конь БоДжек': 'BoJack Horseman',
  'Шерлок': 'Sherlock',
  'Острые козырьки': 'Peaky Blinders',
  'Доктор Хаус': 'House',
  'Офис': 'The Office',
  'Отчаянные домохозяйки': 'Desperate Housewives',
  'Настоящий детектив': 'True Detective',
  'Тьма': 'Dark',
  'Ты': 'You',
  'Чернобыль': 'Chernobyl',
  'Игра престолов': 'Game of Thrones',
  'Нарко': 'Narcos',
  'Ганнибал': 'Hannibal',
  'Сверхъестественное': 'Supernatural',
  'Побег': 'Prison Break',
  'Бумажный дом': 'Money Heist',
  'Очень странные дела': 'Stranger Things',
  'Клан Сопрано': 'The Sopranos',
  'Бесстыжие': 'Shameless',
  'Тед Лассо': 'Ted Lasso',
  'Прослушка': 'The Wire',
  'Наследники': 'Succession',
  'Друзья': 'Friends',
  'Симпсоны': 'The Simpsons',
  'Гравити Фолз': 'Gravity Falls',
  'Теория большого взрыва': 'The Big Bang Theory',
  'Ходячие мертвецы': 'The Walking Dead',
  'Уэнсдэй': 'Wednesday',
  'Рик и Морти': 'Rick and Morty',
};

function getSearchQuery(title: string): string {
  return TITLE_MAP[title] || title;
}

export function useTMDBEpisodes(showTitle: string) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const MAX_SEASONS = 6;

    const fetchEpisodes = async () => {
      if (!showTitle) {
        setLoading(false);
        return;
      }

      try {
        const searchQuery = getSearchQuery(showTitle);
        const searchRes = await fetch(
          `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&language=ru-RU`
        );
        const searchJson = await searchRes.json();

        if (!isMounted || !searchJson.results?.length) {
          setLoading(false);
          return;
        }

        const tvId = searchJson.results[0].id;
        const allEpisodes: Episode[] = [];
        let seasonNum = 1;

        while (seasonNum <= MAX_SEASONS) {
          const seasonRes = await fetch(
            `https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNum}?api_key=${API_KEY}&language=ru-RU`
          );
          const seasonJson = await seasonRes.json();

          if (!isMounted || !seasonJson.episodes?.length) break;

          for (const ep of seasonJson.episodes) {
            allEpisodes.push({
              id: `s${ep.season_number}e${ep.episode_number}`,
              season: ep.season_number,
              episode: ep.episode_number,
              title: ep.name || `Серия ${ep.episode_number}`,
              plot: ep.overview || 'Описание недоступно.',
            });
          }

          seasonNum++;
        }

        if (isMounted) {
          setEpisodes(allEpisodes);
        }
      } catch {
        if (isMounted) setEpisodes([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEpisodes();
    return () => {
      isMounted = false;
    };
  }, [showTitle]);

  return { episodes, loading };
}
