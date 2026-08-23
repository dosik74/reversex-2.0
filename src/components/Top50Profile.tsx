import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Expand, Trash2, GripVertical, Crown, Award, Star, Plus, Search, Loader2, X, Hash, Save } from "lucide-react";
import supabase from "@/utils/supabase";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "@/styles/top50.css";

interface TopList {
  id: string;
  title: string;
  media_type: 'movie' | 'anime' | 'game';
  items?: TopListItem[];
}

interface TopListItem {
  id: string;
  rank: number;
  title?: string;
  poster_url?: string;
  item_id: string;
}

const CATEGORIES = [
  { id: 'movie', label: 'Movies', icon: '🎬' },
  { id: 'anime', label: 'Series', icon: '📺' },
  { id: 'game', label: 'Games', icon: '🎮' },
];

// Категории поиска: media_type в БД → тип контента для поиска
type SearchCategory = 'movie' | 'series' | 'game';
const DB_TO_SEARCH: Record<string, SearchCategory> = {
  movie: 'movie',
  anime: 'series',
  game: 'game',
};

const SEARCH_LABELS: Record<SearchCategory, string> = {
  movie: 'Фильмы',
  series: 'Сериалы',
  game: 'Игры',
};

const MAX_ITEMS = 50;

const RAWG_API_KEY = "c33c648c0d8f45c494af8da025d7b862";

interface SearchResultItem {
  id: string;
  title: string;
  posterUrl: string | null;
  year?: string;
}

interface Top50ProfileProps {
  userId: string;
  isOwnProfile: boolean;
}

const RankMoveControl = ({ rank, maxRank, onMove }: { rank: number; maxRank: number; onMove: (target: number) => void }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(rank));

  const submit = () => {
    const n = parseInt(value);
    if (!isNaN(n) && n >= 1 && n <= maxRank && n !== rank) onMove(n);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        title="Поставить на позицию"
        className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-purple-600/80 p-1.5 rounded-full shadow-lg z-20 flex items-center justify-center"
      >
        <Hash className="w-4 h-4 text-white" />
      </button>
    );
  }

  return (
    <div
      className="bg-zinc-900/95 border border-purple-500/50 rounded-lg px-2 py-1.5 shadow-xl z-30 flex items-center gap-1.5"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <span className="text-[10px] text-zinc-400 font-bold">#</span>
      <input
        type="number"
        min={1}
        max={maxRank}
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
        className="w-14 bg-zinc-800 border border-zinc-700 rounded text-white text-xs text-center py-0.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
      />
      <button onClick={submit} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white transition-colors">
        OK
      </button>
      <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white text-xs px-1">✕</button>
    </div>
  );
};

const SortableItem = ({ item, isOwnProfile, onRemove, mediaType, onMoveToRank }: { item: TopListItem; isOwnProfile: boolean; onRemove: () => void; mediaType: 'movie' | 'anime' | 'game'; onMoveToRank?: (target: number) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/70 hover:border-primary/60 hover:shadow-md transition-all group"
    >
      {isOwnProfile && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing flex-shrink-0">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <span className="rxp-rank-num text-primary w-10 flex-shrink-0">#{item.rank}</span>
      {item.poster_url && (
        <Link
          to={`/${mediaType === 'movie' ? 'movie' : mediaType === 'anime' ? 'series' : 'game'}/${item.item_id}`}
          className="flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={item.poster_url.replace('/w500/', '/w342/')}
            alt={item.title}
            loading="lazy"
            className="rxp-poster-row w-12 h-[4.5rem] object-cover cursor-pointer"
          />
        </Link>
      )}
      <Link
        to={`/${mediaType === 'movie' ? 'movie' : mediaType === 'anime' ? 'series' : 'game'}/${item.item_id}`}
        className="flex-1 min-w-0 hover:text-primary transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="font-grotesk font-medium truncate cursor-pointer">{item.title}</h4>
      </Link>
      {isOwnProfile && onMoveToRank && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <RankMoveControl rank={item.rank} maxRank={50} onMove={onMoveToRank} />
        </div>
      )}
      {isOwnProfile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

const TopRankItem = ({ item, rank, isOwnProfile, onRemove, mediaType, onMoveToRank }: { item: TopListItem; rank: number; isOwnProfile: boolean; onRemove: () => void; mediaType: 'movie' | 'anime' | 'game'; onMoveToRank?: (target: number) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getFrameClass = () => {
    switch (rank) {
      case 1:
        return 'top-rank-1';
      case 2:
        return 'top-rank-2';
      case 3:
        return 'top-rank-3';
      default:
        return 'top-rank-regular';
    }
  };

  const routeBase = mediaType === 'movie' ? 'movie' : mediaType === 'anime' ? 'series' : 'game';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${rank <= 3 ? 'col-span-1' : ''}`}
    >
      {/* Main Card */}
      <div className={`relative ${getFrameClass()} transition-all duration-300 cursor-pointer`}>
        <Link
          to={`/${routeBase}/${item.item_id}`}
          className="relative block overflow-hidden rounded-[14px] aspect-[2/3]"
        >
          {/* Poster */}
          {item.poster_url ? (
            <img
              src={item.poster_url}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center p-4 text-center text-sm text-muted-foreground">
              {item.title}
            </div>
          )}

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />

          {/* Title Section */}
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
            <h4 className="font-grotesk font-bold text-white text-sm md:text-base line-clamp-2 drop-shadow-lg">
              {item.title}
            </h4>
            {rank <= 3 && (
              <span className={`inline-block mt-1.5 text-[9px] font-pixel tracking-[0.2em] uppercase ${
                rank === 1 ? 'text-yellow-300/90' :
                rank === 2 ? 'text-slate-300/90' :
                'text-orange-300/90'
              }`}>
                {rank === 1 ? '★ Gold' : rank === 2 ? '★ Silver' : '★ Bronze'}
              </span>
            )}
          </div>
        </Link>

        {/* Rank Badge - круглая медаль в углу */}
        <div className={`${
          rank === 1 ? 'rank-badge-1' :
          rank === 2 ? 'rank-badge-2' :
          rank === 3 ? 'rank-badge-3' :
          'rank-badge-regular'
        } z-30`}>
          {rank}
        </div>

        {/* Delete Button */}
        {isOwnProfile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-red-500/80 text-white rounded-full shadow-lg z-20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}

        {/* Move to position */}
        {isOwnProfile && onMoveToRank && (
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <RankMoveControl rank={rank} maxRank={50} onMove={onMoveToRank} />
          </div>
        )}

        {/* Drag Handle */}
        {isOwnProfile && (
          <div
            {...attributes}
            {...listeners}
            className="absolute bottom-2 left-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1.5 rounded-full shadow-lg z-20"
          >
            <GripVertical className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

const Top50Profile = ({ userId, isOwnProfile }: Top50ProfileProps) => {
  const [activeCategory, setActiveCategory] = useState<'movie' | 'anime'>('movie');
  const [lists, setLists] = useState<TopList[]>([]);
  const [selectedList, setSelectedList] = useState<TopList | null>(null);
  const [showExpanded, setShowExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add-item dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addSearchCategory, setAddSearchCategory] = useState<SearchCategory>('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadLists();
  }, [userId]);

  useEffect(() => {
    const list = lists.find(l => l.media_type === activeCategory);
    setSelectedList(list || null);
  }, [activeCategory, lists]);

  const totalItems = lists.reduce((acc, l) => acc + (l.items?.length || 0), 0);

  // Пустой топ видит только владелец — скрываем секцию от окружающих
  if (!loading && !isOwnProfile && totalItems === 0) {
    return null;
  }

  const loadLists = async () => {
    try {
      setLoading(true);
      const { data: listsData } = await supabase
        .from('top_lists')
        .select('*')
        .eq('user_id', userId);

      if (!listsData) {
        setLists([]);
        return;
      }

      const listsWithItems = await Promise.all(
        listsData.map(async (list) => {
          const { data: items } = await supabase
            .from('top_list_items')
            .select('*')
            .eq('top_list_id', list.id)
            .order('rank');
          // Нормализация: пересчитываем ранги последовательно,
          // чтобы не было дублей (#2, #2, #3...) после старых багов
          const normalized = (items || [])
            .sort((a, b) => a.rank - b.rank)
            .map((item, idx) => ({ ...item, rank: idx + 1 }));
          return { ...list, items: normalized };
        })
      );

      setLists(listsWithItems);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeItemFromList = async (itemId: string) => {
    if (!selectedList || !isOwnProfile) return;

    try {
      await supabase.from('top_list_items').delete().eq('id', itemId);
      toast.success('Удалено из списка');
      loadLists();
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Не удалось удалить');
    }
  };

  const handleDragEnd = async (event: any) => {
    if (!isOwnProfile || !selectedList) return;

    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = selectedList.items?.findIndex(item => item.id === active.id) ?? -1;
      const newIndex = selectedList.items?.findIndex(item => item.id === over.id) ?? -1;
      if (oldIndex < 0 || newIndex < 0) return;

      const newItems = arrayMove(selectedList.items || [], oldIndex, newIndex);
      const reorderedItems = newItems.map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));

      // Обновляем UI мгновенно
      setSelectedList({
        ...selectedList,
        items: reorderedItems,
      });
      setLists(prev =>
        prev.map(l => l.id === selectedList.id ? { ...l, items: reorderedItems } : l)
      );

      // В БД пишем только те позиции, у которых ранг реально изменился
      const changed = reorderedItems.filter((item, idx) =>
        selectedList.items?.[idx]?.rank !== item.rank
      );

      try {
        await Promise.all(
          changed.map(item =>
            supabase
              .from('top_list_items')
              .update({ rank: item.rank })
              .eq('id', item.id)
          )
        );
        toast.success('Порядок обновлён');
      } catch (error) {
        console.error('Error updating order:', error);
        toast.error('Не удалось обновить порядок');
        loadLists();
      }
    }
  };

  // Ручное сохранение порядка (кнопка «Сохранить»)
  const [savingOrder, setSavingOrder] = useState(false);
  const saveOrder = async () => {
    if (!isOwnProfile || !selectedList || !selectedList.items?.length) return;
    setSavingOrder(true);
    try {
      await Promise.all(
        selectedList.items.map(item =>
          supabase.from('top_list_items').update({ rank: item.rank }).eq('id', item.id)
        )
      );
      toast.success('Порядок сохранён!');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Не удалось сохранить порядок');
      loadLists();
    } finally {
      setSavingOrder(false);
    }
  };

  // Перестановка элемента на конкретную позицию (кнопка #)
  const moveItemToRank = async (itemId: string, targetRank: number) => {
    if (!isOwnProfile || !selectedList) return;
    const items = selectedList.items || [];
    const oldIndex = items.findIndex(i => i.id === itemId);
    if (oldIndex < 0) return;

    const clamped = Math.max(1, Math.min(items.length, targetRank));
    const newIndex = clamped - 1;
    if (newIndex === oldIndex) return;

    const newItems = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    setSelectedList({ ...selectedList, items: newItems });
    setLists(prev => prev.map(l => l.id === selectedList.id ? { ...l, items: newItems } : l));

    try {
      const changed = newItems.filter((item, idx) => items[idx]?.rank !== item.rank);
      await Promise.all(
        changed.map(item =>
          supabase.from('top_list_items').update({ rank: item.rank }).eq('id', item.id)
        )
      );
      toast.success(`Перемещено на #${clamped}`);
    } catch (error) {
      console.error('Error moving item:', error);
      toast.error('Не удалось переместить');
      loadLists();
    }
  };

  const createDefaultLists = async () => {
    try {
      for (const category of CATEGORIES) {
        const { data: existing } = await supabase
          .from('top_lists')
          .select('id')
          .eq('user_id', userId)
          .eq('media_type', category.id)
          .single();

        if (!existing) {
          await supabase.from('top_lists').insert({
            user_id: userId,
            title: `Top 50 ${category.label}`,
            media_type: category.id,
          });
        }
      }
      loadLists();
      toast.success('Списки созданы!');
    } catch (error) {
      console.error('Error creating lists:', error);
    }
  };

  /* ══════════ ADD ITEM VIA SEARCH ══════════ */

  const openAddDialog = () => {
    setAddSearchCategory(DB_TO_SEARCH[selectedList?.media_type || 'movie'] || 'movie');
    setSearchQuery('');
    setSearchResults([]);
    setShowAddDialog(true);
  };

  const searchContent = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    try {
      setSearching(true);
      setSearchResults([]);

      if (addSearchCategory === 'game') {
        const res = await fetch(
          `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(q)}&page_size=24`
        );
        const data = await res.json();
        setSearchResults(
          (data.results || []).map((g: any) => ({
            id: String(g.id),
            title: g.name,
            posterUrl: g.background_image || null,
            year: g.released ? new Date(g.released).getFullYear().toString() : undefined,
          }))
        );
      } else {
        const endpoint = addSearchCategory === 'movie' ? 'search/movie' : 'search/tv';
        const res = await fetch(
          `https://api.themoviedb.org/3/${endpoint}?query=${encodeURIComponent(q)}&page=1&language=ru-RU`,
          {
            headers: {
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhOTgxYjNiYTBiMzQ1ZjU3OGZiOTE3ZWU3NGE5MGJmMyIsIm5iZiI6MTc1MjUyMjUxMy40MjcsInN1YiI6IjY4NzU1ZjExNzUzYjVjNTYwM2Y5MWJkMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Trm6p4NqL6VPKlvUkGkRMKVjeH2KAklTAllVbnolV8w',
              'Accept': 'application/json',
            },
          }
        );
        const data = await res.json();
        setSearchResults(
          (data.results || []).map((m: any) => ({
            id: String(m.id),
            title: m.title || m.name,
            posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
            year: (m.release_date || m.first_air_date || '').slice(0, 4) || undefined,
          }))
        );
      }
    } catch (error) {
      console.error('Error searching content:', error);
      toast.error('Ошибка поиска');
    } finally {
      setSearching(false);
    }
  };

  // Живой поиск: результаты появляются сами по мере ввода
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      searchContent();
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery, addSearchCategory]);

  const addItemToList = async (result: SearchResultItem) => {
    if (!isOwnProfile) return;
    const dbMediaType = (Object.keys(DB_TO_SEARCH).find(
      k => DB_TO_SEARCH[k] === addSearchCategory
    ) || 'movie') as 'movie' | 'anime' | 'game';

    try {
      setAddingId(result.id);
      let topListId: string | undefined;

      const { data: existingList } = await supabase
        .from('top_lists')
        .select('id')
        .eq('user_id', userId)
        .eq('media_type', dbMediaType)
        .single();

      if (existingList) {
        topListId = existingList.id;
      } else {
        const { data: newList, error: createError } = await supabase
          .from('top_lists')
          .insert({
            user_id: userId,
            title: `Top 50 ${SEARCH_LABELS[addSearchCategory]}`,
            media_type: dbMediaType,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        topListId = newList?.id;
      }

      if (!topListId) throw new Error('Failed to create or find top list');

      // Дубликат + лимит — параллельно, чтобы не ждать два запроса подряд
      const [{ data: existingItem }, { count }] = await Promise.all([
        supabase
          .from('top_list_items')
          .select('id')
          .eq('top_list_id', topListId)
          .eq('item_id', result.id)
          .maybeSingle(),
        supabase
          .from('top_list_items')
          .select('id', { count: 'exact', head: true })
          .eq('top_list_id', topListId),
      ]);

      if (existingItem) {
        toast.info('Уже в списке');
        return;
      }

      if ((count || 0) >= MAX_ITEMS) {
        toast.error(`Максимум ${MAX_ITEMS} позиций`);
        return;
      }

      const nextRank = (count || 0) + 1;

      const { error: insertError } = await supabase.from('top_list_items').insert({
        top_list_id: topListId,
        item_id: result.id,
        rank: nextRank,
        title: result.title,
        poster_url: result.posterUrl || '',
      });

      if (insertError) throw insertError;

      // Мгновенно обновляем UI без перезагрузки всего списка
      const newItem = {
        id: `tmp-${Date.now()}`,
        rank: nextRank,
        item_id: result.id,
        title: result.title,
        poster_url: result.posterUrl || '',
      };
      if (selectedList && selectedList.media_type === dbMediaType) {
        setSelectedList({
          ...selectedList,
          items: [...(selectedList.items || []), newItem],
        });
      }
      setLists(prev =>
        prev.map(l => l.media_type === dbMediaType
          ? { ...l, items: [...(l.items || []), newItem] }
          : l
        )
      );
      toast.success(`#${nextRank} — «${result.title}» добавлено в Топ`);
    } catch (error) {
      console.error('Error adding to top list:', error);
      toast.error('Ошибка при добавлении');
    } finally {
      setAddingId(null);
    }
  };

  const itemsCount = selectedList?.items?.length || 0;
  const canAddMore = isOwnProfile && itemsCount < MAX_ITEMS;

  return (
    <>
      <Card className="rxp-panel overflow-hidden p-0">
        {/* ===== HEADER BAND — главный акцент ===== */}
        <div
          className="relative overflow-hidden px-6 md:px-10 pt-9 pb-7 border-b border-border/70"
          style={{
            background:
              'linear-gradient(135deg, hsl(var(--primary) / 0.18), transparent 55%), linear-gradient(315deg, hsl(var(--accent) / 0.14), transparent 55%)',
          }}
        >
          {/* Гигантская контурная цифра */}
          <span aria-hidden className="rxp-top50-watermark absolute -right-4 -top-10 text-[11rem] md:text-[17rem] opacity-80">
            50
          </span>
          {/* Декоративные звёзды */}
          <Star aria-hidden className="absolute right-[26%] top-8 w-5 h-5 text-accent/60 fill-accent/40" />
          <Star aria-hidden className="absolute right-[38%] bottom-6 w-3.5 h-3.5 text-primary/50 fill-primary/30" />

          <div className="relative z-10 flex items-start justify-between gap-4 mb-5">
            <div className="min-w-0">
              <p className="font-pixel text-[9px] tracking-[0.25em] text-accent uppercase mb-3 drop-shadow-sm">
                ★ Personal Ranking
              </p>
              <h3 className="leading-[1.1]">
                <span className="block font-sloop text-[4.5rem] md:text-[7rem] bg-gradient-to-br from-accent via-primary to-accent bg-clip-text text-transparent -mb-1 md:-mb-2 pl-1 pt-2 select-none [text-shadow:none] drop-shadow-[0_0_18px_hsl(var(--accent)/0.35)]">
                  My
                </span>
                <span className="block font-grotesk font-bold tracking-tight text-4xl md:text-6xl rxp-shine pb-1">
                  TOP&nbsp;50
                </span>
              </h3>
            </div>

            {isOwnProfile && (
              <div className="flex-shrink-0 mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {selectedList && itemsCount > 0 && (
                  <Button
                    onClick={saveOrder}
                    disabled={savingOrder}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-purple-500/40 hover:bg-purple-500/10 hover:text-purple-300"
                  >
                    {savingOrder ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Сохранить
                  </Button>
                )}
                <Button onClick={canAddMore ? openAddDialog : createDefaultLists} variant="outline" size="sm" className="gap-1.5">
                  {canAddMore ? (
                    <>
                      <Plus className="w-4 h-4" />
                      Добавить
                    </>
                  ) : (
                    'Create Lists'
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Прогресс заполнения топа */}
          <div className="relative z-10 flex items-center gap-4 mb-6 max-w-md">
            <span className="font-grotesk font-bold text-2xl text-foreground">
              {itemsCount}
              <span className="text-muted-foreground text-base font-medium"> / 50</span>
            </span>
            <div className="rxp-fill-track">
              <div
                className="rxp-fill-bar"
                style={{ width: `${Math.min(100, (itemsCount / MAX_ITEMS) * 100)}%` }}
              />
            </div>
          </div>

          <p className="relative z-10 text-sm text-muted-foreground mb-5">
            {selectedList
              ? `${selectedList.media_type === 'movie' ? 'Фильмы' : selectedList.media_type === 'anime' ? 'Сериалы' : 'Игры'} · личный рейтинг пользователя`
              : 'Выберите категорию'}
          </p>

          {/* Category segmented control */}
          <div className="relative z-10 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
              onClick={() => {
                const currentIdx = CATEGORIES.findIndex(c => c.id === activeCategory);
                const prevIdx = (currentIdx - 1 + CATEGORIES.length) % CATEGORIES.length;
                setActiveCategory(CATEGORIES[prevIdx].id as any);
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex gap-1.5 flex-1 bg-muted/40 p-1 rounded-xl border border-border/50">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`flex-1 h-10 rounded-lg text-sm ${activeCategory === cat.id ? 'shadow-md' : ''}`}
                >
                  <span className="mr-1.5">{cat.icon}</span>
                  {cat.label}
                </Button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
              onClick={() => {
                const currentIdx = CATEGORIES.findIndex(c => c.id === activeCategory);
                const nextIdx = (currentIdx + 1) % CATEGORIES.length;
                setActiveCategory(CATEGORIES[nextIdx].id as any);
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* ===== BODY ===== */}
        <div className="p-5 md:p-8">
          {/* Info Text — только владельцу */}
          {isOwnProfile && (
            <p className="text-sm text-muted-foreground mb-6 text-center">
              💡 Нажмите «+ Добавить», найдите фильм/сериал/игру и добавьте в свой Топ • Перетаскивайте для сортировки
            </p>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : itemsCount > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={(selectedList?.items || []).map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {/* TOP-5 — крупные постеры */}
                {itemsCount > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5 mb-7 pt-4">
                    {(selectedList?.items || []).slice(0, 5).map((item) => (
                      <TopRankItem
                        key={item.id}
                        item={item}
                        rank={item.rank}
                        isOwnProfile={isOwnProfile}
                        mediaType={selectedList?.media_type || 'movie'}
                        onRemove={() => removeItemFromList(item.id)}
                        onMoveToRank={moveItemToRank}
                      />
                    ))}
                  </div>
                )}

                {/* Остальные позиции строками */}
                {itemsCount > 5 && (
                  <div className="space-y-2">
                    {(selectedList?.items || []).slice(5, 10).map((item) => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        isOwnProfile={isOwnProfile}
                        mediaType={selectedList?.media_type || 'movie'}
                        onRemove={() => removeItemFromList(item.id)}
                        onMoveToRank={moveItemToRank}
                      />
                    ))}
                  </div>
                )}

                {/* Кнопка + в конце списка — только владельцу, если есть место */}
                {isOwnProfile && canAddMore && (
                  <button
                    onClick={openAddDialog}
                    disabled={!selectedList}
                    className="mt-4 w-full h-14 rounded-xl border-2 border-dashed border-border/80 hover:border-primary/60 hover:bg-muted/30 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-sm font-medium">Добавить в Топ 50</span>
                  </button>
                )}
              </SortableContext>
            </DndContext>
          ) : (
            /* Empty state — только владелец (для остальных секция скрыта полностью) */
            isOwnProfile && (
              <div className="flex flex-col items-center justify-center py-12">
                <button
                  onClick={openAddDialog}
                  disabled={!selectedList}
                  className="w-20 h-20 rounded-full border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/10 transition-all flex items-center justify-center group mb-6 disabled:opacity-40"
                >
                  <Plus className="w-9 h-9 text-primary/60 group-hover:text-primary group-hover:scale-110 transition-all" />
                </button>
                <p className="font-medium mb-1">Список пуст</p>
                <p className="text-muted-foreground text-sm">Нажмите «+», чтобы найти и добавить первый тайтл</p>
              </div>
            )
          )}

          {/* Show All Button */}
          {itemsCount > 0 && (
            <Button
              onClick={() => setShowExpanded(true)}
              className="w-full gap-2 mt-6 h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-grotesk shadow-lg shadow-primary/20"
            >
              <Expand className="w-4 h-4" />
              Смотреть все {itemsCount}
            </Button>
          )}
        </div>
      </Card>

      {/* ===== Add Item Dialog ===== */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Добавить в Топ 50
            </DialogTitle>
          </DialogHeader>

          {/* Category switcher */}
          <div className="flex gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/50">
            {(Object.keys(SEARCH_LABELS) as SearchCategory[]).map((cat) => (
              <Button
                key={cat}
                variant={addSearchCategory === cat ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setAddSearchCategory(cat);
                  setSearchResults([]);
                }}
                className="flex-1 h-9 rounded-lg text-sm"
              >
                {SEARCH_LABELS[cat]}
              </Button>
            ))}
          </div>

          {/* Search input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') searchContent();
                }}
                placeholder={`Найти ${SEARCH_LABELS[addSearchCategory].toLowerCase()}...`}
                className="pl-9 pr-8"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Button onClick={searchContent} disabled={searching || !searchQuery.trim()} className="gap-2">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Искать
            </Button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[50vh]">
            {searching ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-4">
                {searchResults.map((r) => {
                  const alreadyAdded = selectedList?.items?.some(i => i.item_id === r.id) &&
                    DB_TO_SEARCH[selectedList.media_type] === addSearchCategory;
                  return (
                    <button
                      key={`${addSearchCategory}-${r.id}`}
                      onClick={() => addItemToList(r)}
                      disabled={addingId !== null || !!alreadyAdded}
                      className={`group relative aspect-[2/3] rounded-lg overflow-hidden border transition-all text-left ${
                        alreadyAdded
                          ? 'border-emerald-500/60 opacity-70'
                          : 'border-border/60 hover:border-primary hover:scale-[1.03]'
                      } disabled:cursor-not-allowed`}
                    >
                      {r.posterUrl ? (
                        <img src={r.posterUrl} alt={r.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center p-2 text-center text-xs text-muted-foreground">
                          {r.title}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-2 pt-6">
                        <p className="text-white text-xs font-medium line-clamp-2 leading-tight">{r.title}</p>
                        {r.year && <p className="text-white/60 text-[10px]">{r.year}</p>}
                      </div>
                      {addingId === r.id && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                      )}
                      {alreadyAdded && (
                        <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          ✓ В топе
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                <Search className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">
                  {searchQuery.trim()
                    ? 'Ничего не найдено'
                    : `Введите название ${SEARCH_LABELS[addSearchCategory].toLowerCase()} и нажмите «Искать»`}
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Добавлено в текущую категорию: {itemsCount} / {MAX_ITEMS}
          </p>
        </DialogContent>
      </Dialog>

      {/* Expanded View — FULLSCREEN */}
      <Dialog open={showExpanded} onOpenChange={setShowExpanded}>
        <DialogContent className="rxp-dark fixed inset-0 translate-x-0 translate-y-0 left-0 top-0 w-screen h-screen max-w-none max-h-none rounded-none border-0 overflow-hidden flex flex-col p-0 bg-zinc-950">
          {/* Ambient glows */}
          <div className="pointer-events-none fixed -top-56 left-1/4 -translate-x-1/2 w-[55rem] h-[55rem] rounded-full blur-[160px] opacity-[0.14] bg-gradient-to-br from-purple-500 to-violet-700" />
          <div className="pointer-events-none fixed -bottom-56 right-0 w-[45rem] h-[45rem] rounded-full blur-[150px] opacity-[0.1] bg-gradient-to-br from-amber-400 to-orange-500" />

          {/* Hero Header */}
          <div className="relative z-20 shrink-0 bg-zinc-950/85 backdrop-blur-xl border-b border-white/[0.06]">
            <div className="max-w-[1700px] mx-auto px-4 sm:px-10 py-6 flex items-end justify-between gap-6">
              <div className="min-w-0">
                <p className="font-pixel text-[9px] tracking-[0.3em] text-purple-400 uppercase mb-2 flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-purple-400" /> Personal Ranking
                </p>
                <h2 className="leading-[1.05]">
                  <span className="block font-script text-5xl md:text-7xl text-purple-300 -mb-3 md:-mb-5 pl-1 pt-2 select-none drop-shadow-[0_0_24px_rgba(168,85,247,0.35)]">
                    My
                  </span>
                  <span className="font-grotesk text-4xl md:text-6xl font-bold text-white tracking-tight">
                    TOP&nbsp;50
                  </span>
                  <span className="font-grotesk text-xl md:text-3xl font-bold text-purple-400 ml-3 uppercase">
                    {selectedList?.media_type === 'movie' ? 'Movies' : selectedList?.media_type === 'anime' ? 'Series' : 'Games'}
                  </span>
                </h2>
                <p className="text-zinc-500 text-sm mt-3">
                  {itemsCount === 0 ? 'Пусто' : `${itemsCount} из 50 позиций`}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {isOwnProfile && selectedList && itemsCount > 0 && (
                  <Button
                    onClick={saveOrder}
                    disabled={savingOrder}
                    size="sm"
                    className="gap-2 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-500/25 border-0"
                  >
                    {savingOrder ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Сохранить
                  </Button>
                )}
                <button
                  onClick={() => setShowExpanded(false)}
                  className="w-12 h-12 rounded-full bg-white/[0.06] border border-white/10 hover:bg-red-500/20 hover:border-red-500/40 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-90 flex-shrink-0"
                  title="Закрыть (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="max-w-[1700px] mx-auto px-4 sm:px-10 pb-4">
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, (itemsCount / MAX_ITEMS) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto relative z-10">
            <div className="max-w-[1700px] mx-auto px-4 sm:px-10 py-10">
              {selectedList?.items && selectedList.items.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedList.items.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {/* Podium — Top 3 */}
                    <div className="mb-16">
                      <p className="font-pixel text-[9px] tracking-[0.3em] text-amber-400/80 uppercase mb-6 flex items-center gap-2">
                        <Crown className="w-3.5 h-3.5" /> Призовой подиум
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                        {selectedList.items.slice(0, 3).map((item) => (
                          <TopRankItem
                            key={item.id}
                            item={item}
                            rank={item.rank}
                            isOwnProfile={isOwnProfile}
                            mediaType={selectedList?.media_type || 'movie'}
                            onRemove={() => {
                              removeItemFromList(item.id);
                            }}
                            onMoveToRank={moveItemToRank}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Rest — dense grid */}
                    {selectedList.items.length > 3 && (
                      <div>
                        <p className="font-pixel text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-6">
                          Позиции 4–{selectedList.items.length}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-5">
                          {selectedList.items.slice(3).map((item) => (
                            <TopRankItem
                              key={item.id}
                              item={item}
                              rank={item.rank}
                              isOwnProfile={isOwnProfile}
                              mediaType={selectedList?.media_type || 'movie'}
                              onRemove={() => {
                                removeItemFromList(item.id);
                              }}
                              onMoveToRank={moveItemToRank}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                  <Star className="w-16 h-16 text-zinc-800 mb-6" />
                  <p className="font-grotesk text-2xl text-zinc-400 font-bold mb-2">
                    {isOwnProfile ? 'Список пуст' : 'No items yet'}
                  </p>
                  <p className="text-zinc-600 text-sm">
                    {isOwnProfile ? 'Нажмите «+ Добавить», чтобы начать коллекцию' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Top50Profile;
