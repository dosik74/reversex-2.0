// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import supabase from "@/utils/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  UserPlus,
  UserCheck,
  Users,
  Star,
  Film,
  MessageSquare,
  MapPin,
  Sparkles,
  BarChart3,
  Trash2,
  Send,
  Calendar,
  Clock,
  Eye,
  Share,
  Copy,
   Facebook,
   Twitter,
   Trophy,
   Heart,
   Image as ImageIcon,
   ExternalLink,
   Bookmark,
 } from "lucide-react";
import { Link } from "react-router-dom";
import ProfileSidebar from "@/components/ProfileSidebar";
import ChatWindow from "@/components/ChatWindow";
import { useUserOnline } from "@/hooks/useUserOnline";
import Top50Profile from "@/components/Top50Profile";
import ProfileBookmarks from "@/components/ProfileBookmarks";
import ProfileSettingsEditor, { renderMarkdown } from "@/components/ProfileSettingsEditor";
import type { ShowcaseBlock, Achievement, FavoriteContent } from "@/components/ProfileSettingsEditor";
import "@/styles/profile-fonts.css";
import "@/styles/profile-theme.css";

// Интерфейсы
interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  avatar_frame_url?: string | null;
  background_gif_url: string | null;
  background_url?: string | null;
  background_type?: 'image' | 'video' | null;
  theme?: string | null;
  accent_color?: string | null;
  about_me?: string | null;
  banner_url?: string | null;
   gallery_images?: string[] | null;
   achievements?: Achievement[] | null;
   favorite_content?: FavoriteContent | null;
   showcase?: ShowcaseBlock[] | null;
  custom_slug?: string | null;
  profile_color: string;
  profile_accent: string;
  status: string;
  level: number;
  xp: number;
  location: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// Временные компоненты-заглушки (замените на ваши реальные компоненты)
const UserActivity = ({ userId, showOnlyWatched }: { userId: string; showOnlyWatched: boolean }) => (
  <div className="text-center py-12">
    <div className="rxp-chip mx-auto mb-4">
      <Calendar className="w-6 h-6" />
    </div>
    <h3 className="rxp-section-title justify-center mb-2">Активность</h3>
    <p className="text-muted-foreground">Раздел в разработке</p>
  </div>
);

const ProfileStats = ({ userId }: { userId: string }) => (
  <div className="text-center py-12">
    <div className="rxp-chip mx-auto mb-4">
      <BarChart3 className="w-6 h-6" />
    </div>
    <h3 className="rxp-section-title justify-center mb-2">Статистика</h3>
    <p className="text-muted-foreground">Раздел в разработке</p>
  </div>
);

const ProfileEditor = ({ profile, open, onClose, onUpdate }: { profile: Profile; open: boolean; onClose: () => void; onUpdate: () => void }) => (
  <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 ${open ? 'block' : 'hidden'}`}>
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Редактирование профиля</h2>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-secondary transition-colors">✕</button>
          </div>
          <p className="text-muted-foreground mb-4">Редактор профиля будет здесь</p>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 border border-border rounded-md hover:bg-secondary transition-colors">Отмена</button>
            <button onClick={onUpdate} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">Сохранить</button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Меню «Поделиться»
const ShareMenu = ({ onShare, align = "end" }: { onShare: (platform?: string) => void; align?: "start" | "end" }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="rxp-btn rxp-btn-ghost !px-4">
        <Share className="w-4 h-4" />
        <span className="hidden sm:inline">Поделиться</span>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align={align} className="w-56">
      <DropdownMenuItem onClick={() => onShare('copy')} className="cursor-pointer">
        <Copy className="w-4 h-4 mr-2" />
        <span>Копировать ссылку</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onShare('whatsapp')} className="cursor-pointer">
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-1.557.821-2.989 2.01-4.085 3.481A9.776 9.776 0 002.002 20.5c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 0 12 0zm0 18.52c-4.687 0-8.52-3.802-8.52-8.52 0-1.528.399-3.029 1.154-4.334l.834 1.441c-.728 1.127-1.147 2.458-1.147 3.893 0 4.105 3.292 7.456 7.355 7.456a7.41 7.41 0 003.512-.848l.868 1.495c-1.258.744-2.693 1.17-4.187 1.17z"/>
        </svg>
        <span>WhatsApp</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onShare('telegram')} className="cursor-pointer">
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.02c.242-.213-.054-.33-.373-.117l-6.869 4.332-2.97-.924c-.644-.213-.658-.644.136-.954l11.566-4.461c.54-.213 1.009.131.832.941z"/>
        </svg>
        <span>Telegram</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onShare('facebook')} className="cursor-pointer">
        <Facebook className="w-4 h-4 mr-2" />
        <span>Facebook</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onShare('twitter')} className="cursor-pointer">
        <Twitter className="w-4 h-4 mr-2" />
        <span>Twitter/X</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

// Иконка-чип в фирменном стиле профиля
const IconChip = ({ icon: Icon, solid = false, className = "" }: { icon: any; solid?: boolean; className?: string }) => (
  <span className={`rxp-chip ${solid ? 'rxp-chip-solid' : ''} ${className}`}>
    <Icon className="w-5 h-5" />
  </span>
);

const RESERVED_SLUGS = new Set([
  'movies', 'explore-movies', 'movie', 'series', 'person', 'company', 'studio',
  'ws', 'recommendations', 'tier-lists', 'profile', 'id', 'bookmarks', 'qr-scan',
  'settings', 'games', 'game', 'music', 'books', 'tusau', 'admin', 'auth',
  'qr-auth', 'br', 'br-batyrhan', 'tasks', 'workspace', 'workspace-auth',
  'download', 'youtube-downloader', 'de', 'api', 'assets', 'not-found'
]);

// Модульный кэш данных профилей (Stale-While-Revalidate)
// Гарантирует моментальный рендер при навигации «Назад», исключает схлопывание высоты DOM и сброс скролла
const profileCache = new Map<string, Profile>();
const profileStatsCache = new Map<string, { movies: number; followers: number; following: number; comments: number }>();
const profileCommentsCache = new Map<string, Comment[]>();

// Основной компонент профиля
const Profile = () => {
  const params = useParams<{ userId?: string; slug?: string; username?: string }>();
  const rawIdentifier = (params.username || params.userId || params.slug || '').trim();

  const isReserved = RESERVED_SLUGS.has(rawIdentifier.toLowerCase());

  const cachedProfile = rawIdentifier ? profileCache.get(rawIdentifier) : null;
  const initialResolvedId = cachedProfile?.id || (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawIdentifier) ? rawIdentifier : null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(initialResolvedId);

  const [profile, setProfile] = useState<Profile | null>(() => (rawIdentifier ? profileCache.get(rawIdentifier) || null : null));
  const { online: isOnline } = useUserOnline(profile?.id);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [stats, setStats] = useState(() => (rawIdentifier && profileStatsCache.get(rawIdentifier)) || { movies: 0, followers: 0, following: 0, comments: 0 });
  const [loading, setLoading] = useState(() => (rawIdentifier ? !profileCache.has(rawIdentifier) : true));
  const [showEditor, setShowEditor] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [comments, setComments] = useState<Comment[]>(() => (rawIdentifier ? profileCommentsCache.get(rawIdentifier) || [] : []));
  const [newComment, setNewComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeTab, setActiveTabState] = useState(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem(`rx_profile_tab_${rawIdentifier}`) : null;
    if (saved === 'watched') return 'bookmarks';
    return saved || "bookmarks";
  });

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    try {
      sessionStorage.setItem(`rx_profile_tab_${rawIdentifier}`, tab);
    } catch {}
  };

  const [error, setError] = useState<string | null>(null);

  // Загрузка данных
  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (rawIdentifier && !isReserved) {
      const savedTab = sessionStorage.getItem(`rx_profile_tab_${rawIdentifier}`);
      if (savedTab) setActiveTabState(savedTab === 'watched' ? 'bookmarks' : savedTab);
      if (!profileCache.has(rawIdentifier)) {
        setLoading(true);
      }
      setError(null);
      fetchProfile();
    } else if (isReserved) {
      setError("Профиль не найден");
      setLoading(false);
    }
  }, [rawIdentifier]);

  useEffect(() => {
    const targetUid = profile?.id || resolvedUserId;
    if (currentUserId && targetUid && currentUserId !== targetUid) {
      checkFollowStatus(targetUid);
      checkFriendshipStatus(targetUid);
    }
  }, [currentUserId, resolvedUserId, profile?.id]);

  // Функции работы с данными
  const getCurrentUser = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    } catch (e) {
      setCurrentUserId(null);
    }
  };

  const fetchProfile = async () => {
    if (!rawIdentifier || isReserved) {
      setError("Профиль не найден");
      setLoading(false);
      return;
    }

    try {
      if (!profileCache.has(rawIdentifier)) {
        setLoading(true);
      }

      // Создаем таймаут для запроса (10 секунд)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawIdentifier);

        let query = supabase.from("profiles").select("*");
        if (isUUID) {
          query = query.eq("id", rawIdentifier);
        } else {
          query = query.or(`username.ilike.${rawIdentifier},custom_slug.eq.${rawIdentifier}`);
        }

        const { data, error: dbError } = await query.maybeSingle();

        clearTimeout(timeoutId);

        if (dbError) {
          console.error("Database error:", dbError);
          throw dbError;
        }

        if (!data) {
          setError("Профиль не найден");
          setProfile(null);
          profileCache.delete(rawIdentifier);
        } else {
          profileCache.set(rawIdentifier, data);
          profileCache.set(data.id, data);
          if (data.username) profileCache.set(data.username, data);

          setProfile(data);
          const realUid = data.id;
          setResolvedUserId(realUid);
          setError(null);

          // Steam & GitHub стиль URL:
          // Если в строке браузера UUID или /profile/ или /id/,
          // автоматически обновляем адресную строку на чистый /:username (как https://github.com/dosik74)
          if (data.username && typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const targetPath = `/${data.username}`;
            if (currentPath !== targetPath && (isUUID || currentPath.startsWith('/profile/') || currentPath.startsWith('/id/'))) {
              window.history.replaceState(null, '', targetPath);
            }
          }

          fetchStats(realUid);
          fetchComments(realUid);
          if (currentUserId && currentUserId !== realUid) {
            checkFollowStatus(realUid);
            checkFriendshipStatus(realUid);
          }
        }
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      const errorMessage = err instanceof Error ? err.message : "Ошибка загрузки профиля. Проверьте подключение и попробуйте снова.";
      setError(errorMessage);
      if (!profileCache.has(rawIdentifier)) {
        setProfile(null);
      }
      if (process.env.NODE_ENV === 'development') {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (targetUid: string = resolvedUserId || profile?.id || '') => {
    if (!targetUid) return;

    try {
      const [bookmarksRes, followersRes, followingRes, commentsRes] = await Promise.allSettled([
        supabase
          .from('content_bookmarks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', targetUid),
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', targetUid),
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', targetUid),
        supabase
          .from('profile_comments')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', targetUid)
      ]);

      const getCount = (result: PromiseSettledResult<any>) => {
        if (result.status === 'fulfilled' && result.value) {
          if (typeof result.value.count === 'number') return result.value.count;
          if (Array.isArray(result.value.data)) return result.value.data.length;
        }
        return 0;
      };

      // Check local cache if supabase count is 0
      let bookmarksCount = getCount(bookmarksRes);
      if (bookmarksCount === 0) {
        try {
          const cached = localStorage.getItem(`rx_public_bookmarks_${targetUid}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) bookmarksCount = parsed.length;
          }
        } catch {}
      }

      const newStats = {
        movies: bookmarksCount,
        followers: getCount(followersRes),
        following: getCount(followingRes),
        comments: getCount(commentsRes)
      };
      profileStatsCache.set(targetUid, newStats);
      if (rawIdentifier) profileStatsCache.set(rawIdentifier, newStats);
      setStats(newStats);
    } catch (err) {
      console.error('Error fetching stats:', err);
      if (!profileStatsCache.has(targetUid)) {
        setStats({ movies: 0, followers: 0, following: 0, comments: 0 });
      }
    }
  };

  const fetchComments = async (targetUid: string = resolvedUserId || profile?.id || '') => {
    if (!targetUid) return;

    try {
      if (!profileCommentsCache.has(targetUid)) {
        setCommentsLoading(true);
      }
      const { data, error } = await supabase
        .from("profile_comments")
        .select(`id, content, created_at, author_id, author:profiles(username, display_name, avatar_url)`)
        .eq("profile_id", targetUid)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const items = data || [];
      profileCommentsCache.set(targetUid, items);
      if (rawIdentifier) profileCommentsCache.set(rawIdentifier, items);
      setComments(items);
    } catch (err) {
      console.error(err);
      if (!profileCommentsCache.has(targetUid)) {
        setComments([]);
      }
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      // Временная имитация отправки
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        content: newComment.trim(),
        created_at: new Date().toISOString(),
        author_id: currentUserId,
        author: {
          username: "currentuser",
          display_name: "Текущий пользователь",
          avatar_url: null
        }
      };

      setComments(prev => [newCommentObj, ...prev]);
      setNewComment("");
      toast.success("Комментарий добавлен");

      // Для реального использования раскомментируйте:
      // const { error } = await supabase.from("profile_comments").insert({
      //   profile_id: userId,
      //   author_id: currentUserId,
      //   content: newComment.trim(),
      // });
      // if (error) throw error;
      // setNewComment("");
      // toast.success("Комментарий добавлен");
      // fetchComments();
    } catch (err) {
      console.error(err);
      toast.error("Ошибка добавления комментария");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      toast.success("Комментарий удален");

      // Для реального использования раскомментируйте:
      // const { error } = await supabase.from("profile_comments").delete().eq("id", commentId);
      // if (error) throw error;
      // toast.success("Комментарий удален");
      // fetchComments();
    } catch (err) {
      console.error(err);
      toast.error("Ошибка удаления комментария");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const checkFriendshipStatus = async (targetUid: string = resolvedUserId || profile?.id || '') => {
    if (!currentUserId || !targetUid) return;

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('status')
        .or(
          `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUid}),` +
          `and(requester_id.eq.${targetUid},addressee_id.eq.${currentUserId})`
        )
        .maybeSingle();

      if (error) throw error;
      setFriendshipStatus(data?.status || null);
      setIsFriend(data?.status === 'accepted');
    } catch (err) {
      console.error('Error checking friendship:', err);
      setFriendshipStatus(null);
      setIsFriend(false);
    }
  };

  const handleFollow = async () => {
    const targetUid = profile?.id || resolvedUserId;
    if (!currentUserId || !targetUid) {
      toast.error("Войдите, чтобы подписаться");
      return;
    }

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUid);
        if (error) throw error;
        toast.success("Отписано");
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: currentUserId, following_id: targetUid });
        if (error) throw error;
        toast.success("Подписано");
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error(err);
      toast.error("Ошибка обновления подписки");
    }
  };

  const handleShareProfile = async (platform?: string) => {
    const targetUid = profile?.id || resolvedUserId;
    const handle = profile?.username || profile?.custom_slug || targetUid;
    const profileUrl = `${window.location.origin}/${handle}`;
    const shareText = `Посмотри мой профиль на ReverseX! ${profile?.display_name || profile?.username}`;

    try {
      if (platform === 'copy') {
        await navigator.clipboard.writeText(profileUrl);
        toast.success("Ссылка скопирована в буфер обмена");
      } else if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + profileUrl)}`, '_blank');
      } else if (platform === 'telegram') {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
      } else if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`, '_blank');
      } else if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`, '_blank');
      } else if (navigator.share) {
        await navigator.share({
          title: 'ReverseX Профиль',
          text: shareText,
          url: profileUrl,
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        toast.success("Ссылка скопирована в буфер обмена");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share error:', err);
        toast.error("Ошибка при поделении профилем");
      }
    }
  };

  const checkFollowStatus = async (targetUid: string = resolvedUserId || profile?.id || '') => {
    if (!currentUserId || !targetUid) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUid)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (err) {
      console.error('Error checking follow status:', err);
      setIsFollowing(false);
    }
  };

  const handleFriendRequest = async () => {
    const targetUid = profile?.id || resolvedUserId;
    if (!currentUserId || !targetUid) return;

    try {
      const { data: created, error } = await supabase
        .from('friendships')
        .insert({ requester_id: currentUserId, addressee_id: targetUid })
        .select('id')
        .single();
      if (error) throw error;
      await supabase.from('notifications').insert({
        user_id: targetUid,
        actor_id: currentUserId,
        type: 'friend_request',
        data: { friendship_id: created?.id },
      });
      toast.success("Запрос на дружбу отправлен");
      setFriendshipStatus("pending");
    } catch (err) {
      console.error("Error sending friend request:", err);
      toast.error("Ошибка отправки запроса");
    }
  };

  // Обновляем кнопку «В друзья» сразу после принятия заявки в уведомлениях
  useEffect(() => {
    const onChange = () => checkFriendshipStatus();
    window.addEventListener('rx:friendship-changed', onChange);
    return () => window.removeEventListener('rx:friendship-changed', onChange);
  });

  // Состояния загрузки
  if (loading) {
    return (
      <div className="rxp-scope min-h-screen flex items-center justify-center">
        <div className="text-center space-y-5">
          <div className="rxp-spinner" />
          <p className="font-pixel text-[10px] text-muted-foreground tracking-widest">LOADING PROFILE...</p>
        </div>
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className="rxp-scope min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="rxp-chip mx-auto w-20 h-20">
            <Users className="w-9 h-9" />
          </div>
          <h2 className="rxp-name text-3xl">Профиль не найден</h2>
          <p className="font-pixel text-[9px] text-muted-foreground">{error || "Пользователь с таким ID не существует"}</p>
          <div className="flex gap-3 justify-center pt-4">
            <button onClick={fetchProfile} className="rxp-btn rxp-btn-neon">
              Попробовать снова
            </button>
            <Link to="/" className="rxp-btn rxp-btn-ghost">
              На главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const targetId = resolvedUserId || profile?.id;
  const isOwnProfile = Boolean(currentUserId && targetId && currentUserId === targetId);

  const accentColor = profile.accent_color || profile.profile_accent;

  const hasCustomBg = !!profile.background_url;
  const backgroundStyle = profile.background_gif_url
    ? {
        backgroundImage: `url(${profile.background_gif_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: `
          radial-gradient(700px 300px at 75% 20%, ${profile.profile_color}55, transparent 60%),
          radial-gradient(600px 280px at 25% 80%, ${accentColor}44, transparent 60%),
          linear-gradient(135deg, hsl(250 40% 8%), hsl(255 45% 12%))
        `,
      };

  const statTiles = [
    {
      icon: Bookmark,
      value: stats.movies,
      label: "Закладки",
      onClick: () => setActiveTab("bookmarks"),
    },
    {
      icon: Users,
      value: stats.followers,
      label: "Подписчики",
    },
    {
      icon: UserPlus,
      value: stats.following,
      label: "Подписки",
    },
    {
      icon: MessageSquare,
      value: stats.comments,
      label: "Комментарии",
      onClick: () => document.getElementById("profile-comments")?.scrollIntoView({ behavior: "smooth" }),
    },
  ];

  return (
    <div
      className="rxp-scope min-h-screen text-foreground"
      style={{ ['--rxp-accent' as any]: accentColor }}
    >
      {/* ===== ПОЛЬЗОВАТЕЛЬСКИЙ ФОН (обои на весь экран) ===== */}
      {hasCustomBg && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {profile.background_type === 'video' ? (
            <video
              src={profile.background_url!}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover scale-110 blur-[2px]"
            />
          ) : (
            <img
              src={profile.background_url!}
              alt=""
              className="w-full h-full object-cover scale-110 blur-[2px]"
            />
          )}
          <div className="absolute inset-0 bg-background/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background" />
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at center, transparent 40%, hsl(var(--background) / 0.55) 100%)' }}
          />
        </div>
      )}
      <div className={hasCustomBg ? 'relative z-10' : ''}>
      {/* ===== HERO ===== */}
      <header className="rxp-hero relative h-[320px] md:h-[380px]" style={backgroundStyle}>
        {/* затемнение для читаемости */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-background/95" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="w-full mx-auto px-4 pb-0 translate-y-1/2">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
              {/* Аватар + Информация */}
              <div className="flex items-end gap-5 md:gap-7 min-w-0">
                {/* Аватар */}
                <div className="relative flex-shrink-0">
                  <div className="rxp-avatar-frame">
                    {/* Пользовательская рамка (GIF/APNG) поверх аватара */}
                    {profile.avatar_frame_url && (
                      <div className="absolute inset-0 z-[5] rounded-full overflow-hidden pointer-events-none">
                        <img
                          src={profile.avatar_frame_url}
                          alt=""
                          className="w-full h-full object-cover rounded-full"
                          style={{ transform: 'scale(1.35)' }}
                        />
                      </div>
                    )}
                    <Avatar className="avatar-wrap w-28 h-28 md:w-36 md:h-36 rounded-full shadow-2xl">
                      <AvatarImage src={profile.avatar_url || undefined} className="rounded-full object-cover" />
                      <AvatarFallback className="rounded-full text-4xl font-grotesk font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                        {profile.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span
                    title={isOnline ? 'В сети' : 'Не в сети'}
                    className={`rxp-status ${isOnline ? 'bg-green-400 text-green-400' : 'bg-gray-500 text-gray-500'}`}
                  />
                </div>

                {/* Имя, ник, уровень, опыт */}
                <div className="flex-1 min-w-0 pb-1">
                  <h1 className="rxp-name text-white text-3xl md:text-5xl font-bold break-words drop-shadow-md">
                    {profile.display_name || profile.username}
                  </h1>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="rxp-neon-handle">@{profile.username}</span>
                    <span className="rxp-caret hidden sm:inline-block" />
                  </div>

                  <div className="mt-3.5 flex items-center gap-3 flex-wrap">
                    <span className="rxp-lv-chip inline-flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      LV.{profile.level}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div className="rxp-xp-track">
                        <div
                          className="rxp-xp-fill"
                          style={{ width: `${Math.min(100, (profile.xp % 500) / 5 || 10)}%` }}
                        />
                      </div>
                      <span className="font-pixel text-[8px] text-muted-foreground">{profile.xp % 500}/500 XP</span>
                    </div>
                    {profile.location && (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="rxp-location">{profile.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Кнопки действий — теперь прямо на уровне профиля! */}
              <div className="flex items-center gap-2.5 flex-wrap pb-1.5 lg:self-end">
                {/* Переходник в закладки пользователя */}
                <Link
                  to={`/bookmarks/${profile?.username || targetId}`}
                  className="rxp-btn rxp-btn-ghost hover:border-emerald-500/50 hover:text-emerald-400 group flex items-center gap-2"
                  title="Открыть все закладки на отдельной странице"
                >
                  <Bookmark className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Закладки</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </Link>

                {isOwnProfile ? (
                  <>
                    <Link to="/profile-studio" className="rxp-btn rxp-btn-ghost">
                      <Sparkles className="w-4 h-4" />
                      Конструктор
                    </Link>
                    <button
                      onClick={() => setShowEditor(true)}
                      className="rxp-btn rxp-btn-neon shadow-lg hover:shadow-cyan-500/25"
                    >
                      <Sparkles className="w-4 h-4" />
                      Редактировать профиль
                    </button>
                    <ShareMenu onShare={handleShareProfile} />
                  </>
                ) : (
                  <>
                    <button onClick={handleFollow} className={`rxp-btn ${isFollowing ? 'rxp-btn-ghost' : 'rxp-btn-neon shadow-lg'}`}>
                      {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {isFollowing ? "Подписано" : "Подписаться"}
                    </button>

                    {!friendshipStatus && (
                      <button onClick={handleFriendRequest} className="rxp-btn rxp-btn-ghost">
                        <Users className="w-4 h-4" />
                        В друзья
                      </button>
                    )}

                    {friendshipStatus === "pending" && (
                      <button disabled className="rxp-btn rxp-btn-ghost">
                        Запрос отправлен
                      </button>
                    )}

                    {friendshipStatus === "accepted" && (
                      <>
                        <button disabled className="rxp-btn rxp-btn-ghost">
                          <Users className="w-4 h-4" />
                          Друзья
                        </button>
                        <button
                          onClick={() => setShowChat(true)}
                          className="rxp-btn rxp-btn-ghost"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Сообщение
                        </button>
                      </>
                    )}
                    <ShareMenu onShare={handleShareProfile} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== ЛЕНТА СТАТИСТИКИ (Интерактивные кнопки-счётчики) ===== */}
      <section className="w-full mx-auto px-4 mt-32 sm:mt-28 lg:mt-24">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statTiles.map(({ icon, value, label, onClick }) => (
            <div
              key={label}
              onClick={onClick}
              className={`rxp-stat-tile ${onClick ? 'cursor-pointer hover:border-primary/80 transition-all' : ''}`}
              title={onClick ? `Перейти к ${label}` : undefined}
            >
              <IconChip icon={icon} />
              <div>
                <div className="rxp-stat-value">{value}</div>
                <div className="rxp-stat-label">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ОСНОВНАЯ СЕТКА: сайдбар слева, контент справа ===== */}
      <div className="w-full mx-auto px-4 mt-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Левая колонка — уровень и друзья */}
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <div className="lg:sticky lg:top-6 space-y-6">
              <ProfileSidebar userId={targetId!} userLevel={profile.level} userXP={profile.xp} />
            </div>
          </aside>

          {/* Правая колонка — био и вкладки */}
          <main className="lg:col-span-9 order-1 lg:order-2 space-y-6">

            {/* Витринные блоки — порядок и видимость из настроек профиля */}
            {(() => {
              const canSee = (b?: ShowcaseBlock) => {
                if (!b) return true;
                if (b.visible === false || b.visibility === 'hidden') return false;
                if (b.visibility === 'friends' && !isOwnProfile && !isFriend) return false;
                return true;
              };

              const configured = (profile.showcase || []).filter((b) => b.visible !== false && b.type !== 'stats');
              const blocks: ShowcaseBlock[] = configured.length
                ? configured
                : [
                    { type: 'about', visible: true, visibility: 'all' },
                    { type: 'achievements', visible: true, visibility: 'all' },
                  ];

              const renderers: Record<string, () => JSX.Element | null> = {
                about: () =>
                  profile.about_me ? (
                    <div className="rxp-panel p-6">
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(profile.about_me) }} />
                    </div>
                  ) : null,

                gallery: () =>
                  (profile.gallery_images || []).length ? (
                    <div className="rxp-panel p-6">
                      <h3 className="rxp-section-title mb-4">
                        <ImageIcon className="w-5 h-5 text-primary" />
                        Галерея
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {profile.gallery_images!.map((img, i) => (
                          <a
                            key={i}
                            href={img}
                            target="_blank"
                            rel="noopener"
                            className="rounded-xl overflow-hidden border border-border hover:border-primary/60 transition-all group"
                          >
                            <img
                              src={img}
                              alt=""
                              loading="lazy"
                              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0.15')}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null,

                achievements: () =>
                  (profile.achievements || []).length ? (
                    <div className="rxp-panel p-6">
                      <h3 className="rxp-section-title mb-4">
                        <Trophy className="w-5 h-5 text-primary" />
                        Достижения
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {profile.achievements!.map((a, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/30"
                          >
                            <span className="text-2xl flex-shrink-0">{a.icon || "🏆"}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{a.title}</p>
                              {a.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {a.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null,

                inventory: () => null,

                favorite: () =>
                  profile.favorite_content?.title ? (
                    <div className="rxp-panel overflow-hidden">
                      <a
                        href={profile.favorite_content.url || undefined}
                        target={profile.favorite_content.url ? "_blank" : undefined}
                        rel="noopener"
                        className="block relative h-44 group"
                      >
                        {profile.favorite_content.image_url ? (
                          <img
                            src={profile.favorite_content.image_url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30" />
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-400 fill-red-400 flex-shrink-0" />
                          <span className="text-white font-semibold">{profile.favorite_content.title}</span>
                          {profile.favorite_content.url && (
                            <ExternalLink className="w-4 h-4 text-white/70 ml-auto" />
                          )}
                        </div>
                      </a>
                    </div>
                  ) : null,
              };

              return blocks.map((b) =>
                renderers[b.type] && canSee(b) ? (
                  <div key={b.type}>{renderers[b.type]()}</div>
                ) : null
              );
            })()}

            {/* Био */}
            {profile.bio && (
              <div className="rxp-panel p-6 pl-9 rxp-bio-quote">
                <p className="rxp-bio-text">{profile.bio}</p>
              </div>
            )}

            {/* Вкладки */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="rxp-tabs-shell">
                <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-4' : 'grid-cols-3'} bg-transparent p-0 h-auto`}>
                  <TabsTrigger value="favorites" className="rxp-tab-trigger">
                    <Star className="w-4 h-4" />
                    <span className="rxp-tab-label">Top50</span>
                  </TabsTrigger>

                  <TabsTrigger value="bookmarks" className="rxp-tab-trigger">
                    <Bookmark className="w-4 h-4" />
                    <span className="rxp-tab-label">Закладки</span>
                  </TabsTrigger>

                  <TabsTrigger value="activity" className="rxp-tab-trigger">
                    <Calendar className="w-4 h-4" />
                    <span className="rxp-tab-label">Activity</span>
                  </TabsTrigger>

                  {isOwnProfile && (
                    <TabsTrigger value="customizations" className="rxp-tab-trigger">
                      <Sparkles className="w-4 h-4" />
                      <span className="rxp-tab-label">Theme</span>
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              {/* Контент вкладок */}
              <TabsContent value="favorites" className="animate-fade-in">
                <Top50Profile userId={targetId!} isOwnProfile={isOwnProfile} />
              </TabsContent>

              <TabsContent value="bookmarks" className="animate-fade-in">
                <ProfileBookmarks userId={targetId!} isOwnProfile={isOwnProfile} username={profile?.username} />
              </TabsContent>

              <TabsContent value="activity" className="animate-fade-in">
                <div className="rxp-panel p-6">
                  <UserActivity userId={targetId!} showOnlyWatched={false} />
                </div>
              </TabsContent>

              {isOwnProfile && (
                <TabsContent value="customizations" className="animate-fade-in">
                  <div className="rxp-panel p-6 space-y-6">
                    <div>
                      <h3 className="rxp-section-title mb-4">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Основной цвет
                      </h3>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                        {['#B8935A', '#7A94B8', '#6B8F71', '#9C6B6B', '#8A7AB0', '#5E8B99', '#A08252', '#707C8A'].map((color) => (
                          <button
                            key={color}
                            className="w-11 h-11 rounded-xl border-2 border-white/10 hover:border-white/60 hover:scale-110 transition-all shadow-lg"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="rxp-section-title mb-4">Стиль карточек</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { name: 'Минимальный', cls: '' },
                          { name: 'С контуром', cls: 'border border-primary/50' },
                          { name: 'Приподнятый', cls: 'shadow-[0_10px_30px_rgba(34,211,238,0.15)]' },
                          { name: 'Градиент', cls: 'bg-gradient-to-br from-primary/20 to-accent/20' },
                        ].map(({ name, cls }) => (
                          <button key={name} className={`rxp-panel p-4 cursor-pointer hover:border-primary/70 text-left transition-all ${cls}`}>
                            <span className="text-sm">{name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button className="rxp-btn rxp-btn-neon w-full justify-center">
                      <Send className="w-4 h-4" />
                      Сохранить оформление
                    </button>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </main>
        </div>

        {/* ===== КОММЕНТАРИИ (таймлайн на всю ширину) ===== */}
        <div id="profile-comments" className="mt-10">
          <div className="rxp-panel p-6 md:p-8">
            <div className="flex items-center gap-3 mb-7">
              <IconChip icon={MessageSquare} solid />
              <h2 className="rxp-section-title text-xl">Комментарии</h2>
              <Badge variant="secondary" className="font-pixel text-[9px] ml-1">
                {stats.comments}
              </Badge>
            </div>

            {currentUserId && (
              <form onSubmit={handleSubmitComment} className="space-y-3 mb-9">
                <div className="rxp-input-shell relative">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Поделитесь своими мыслями..."
                    rows={3}
                    maxLength={500}
                    className="bg-transparent resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <span className={`absolute bottom-3 right-4 text-xs font-pixel ${newComment.length > 450 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {newComment.length}/500
                  </span>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="rxp-btn rxp-btn-neon"
                  >
                    <Send className="w-4 h-4" />
                    Опубликовать
                  </button>
                </div>
              </form>
            )}

            <div className="rxp-comments-list space-y-4">
              {commentsLoading ? (
                <div className="text-center py-10">
                  <div className="rxp-spinner scale-75" />
                  <p className="text-muted-foreground mt-4">Загружаем комментарии...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <MessageSquare className="w-12 h-12 mx-auto opacity-30 text-primary" />
                  <p className="text-lg text-muted-foreground">Здесь пока нет комментариев</p>
                  <p className="font-script text-xl text-primary/80">Будьте первым!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="rxp-comment-card flex gap-4 p-4">
                    <Link to={comment.author?.username ? `/${comment.author.username}` : `/profile/${comment.author_id}`} className="flex-shrink-0">
                      <span className="rxp-comment-avatar">
                        <Avatar className="avatar-wrap w-10 h-10">
                          <AvatarImage src={comment.author?.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-grotesk">
                            {comment.author?.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </span>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <Link to={comment.author?.username ? `/${comment.author.username}` : `/profile/${comment.author_id}`}>
                            <span className="rxp-comment-name hover:text-primary cursor-pointer transition-colors">
                              {comment.author?.display_name || comment.author?.username || "Unknown"}
                            </span>
                          </Link>
                          <p className="rxp-comment-date flex items-center gap-1.5 mt-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(comment.created_at)}
                          </p>
                        </div>

                        {(isOwnProfile || currentUserId === comment.author_id) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-2 text-destructive hover:bg-destructive/20 rounded-lg transition-colors h-8 w-8 flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm break-words whitespace-pre-wrap leading-relaxed text-foreground/90">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Модальные окна */}
      {showEditor && profile && (
        <ProfileSettingsEditor
          userId={targetId!}
          open={showEditor}
          onClose={() => setShowEditor(false)}
          onSaved={fetchProfile}
          initial={{
            avatar_url: profile.avatar_url,
            avatar_frame_url: profile.avatar_frame_url,
            background_url: profile.background_url,
            background_type: profile.background_type || 'image',
            theme: profile.theme || 'dark',
            accent_color: profile.accent_color,
            about_me: profile.about_me,
            banner_url: profile.banner_url,
            gallery_images: profile.gallery_images || [],
            achievements: profile.achievements || [],
            favorite_content: profile.favorite_content || null,
            showcase: profile.showcase || [],
            customization: {},
          }}
        />
      )}

      {showChat && !isOwnProfile && profile && (
        <ChatWindow
          open={showChat}
          onClose={() => setShowChat(false)}
          friendId={targetId!}
          friendUsername={profile.username}
          friendAvatar={profile.avatar_url}
          currentUserId={currentUserId!}
        />
      )}
    </div>
  );
};

export default Profile;
