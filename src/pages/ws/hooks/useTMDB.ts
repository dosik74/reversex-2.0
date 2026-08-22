import { useState, useEffect } from 'react';

const API_KEY = 'a981b3ba0b345f578fb917ee74a90bf3';

export function useTMDB(title: string) {
  const [data, setData] = useState({
    posterUrl: '',
    backdropUrl: '',
    overview: '',
    rating: 0,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchTMDB = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(title)}&language=ru-RU`
        );
        const json = await res.json();
        
        if (isMounted && json.results && json.results.length > 0) {
          const show = json.results[0];
          setData({
            posterUrl: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : '',
            backdropUrl: show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : '',
            overview: show.overview || '',
            rating: show.vote_average || 0,
            loading: false,
          });
        } else if (isMounted) {
          setData(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        if (isMounted) {
          setData(prev => ({ ...prev, loading: false }));
        }
      }
    };

    if (title) {
      fetchTMDB();
    } else {
      setData(prev => ({ ...prev, loading: false }));
    }

    return () => {
      isMounted = false;
    };
  }, [title]);

  return data;
}
