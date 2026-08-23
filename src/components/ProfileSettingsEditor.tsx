import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ImagePlus, Palette, LayoutGrid, Info, Link2,
  ChevronUp, ChevronDown, Save, Loader2, Video, Eye, Lock, Globe, Users,
  Trophy, Heart, Plus, Upload, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import supabase from '@/lib/supabase';

/* ═══ Типы ═══ */
export interface ShowcaseBlock {
  type: string;
  visible: boolean;
  visibility: 'all' | 'friends' | 'hidden';
}

export interface Achievement {
  title: string;
  description?: string;
  icon?: string;
}

export interface FavoriteContent {
  title: string;
  image_url?: string;
  url?: string;
}

export interface ProfileCustomizationData {
  avatar_frame_url?: string | null;
  background_url?: string | null;
  background_type?: 'image' | 'video';
  theme?: string;
  accent_color?: string | null;
  about_me?: string | null;
  banner_url?: string | null;
  gallery_images?: string[];
  achievements?: Achievement[];
  favorite_content?: FavoriteContent | null;
  showcase?: ShowcaseBlock[];
  customization?: Record<string, any>;
}

const THEMES = [
  { id: 'dark', label: 'Тёмная', icon: '🌙', accent: '#a78bfa' },
  { id: 'neon', label: 'Неон', icon: '⚡', accent: '#22d3ee' },
  { id: 'cosmic', label: 'Космос', icon: '🌌', accent: '#f472b6' },
  { id: 'light', label: 'Светлая', icon: '☀️', accent: '#f59e0b' },
];

const ALL_BLOCKS: ShowcaseBlock[] = [
  { type: 'about', visible: true, visibility: 'all' },
  { type: 'gallery', visible: false, visibility: 'all' },
  { type: 'achievements', visible: true, visibility: 'all' },
  { type: 'inventory', visible: false, visibility: 'friends' },
  { type: 'favorite', visible: true, visibility: 'all' },
  { type: 'stats', visible: true, visibility: 'all' },
];

const BLOCK_LABELS: Record<string, string> = {
  about: 'О себе (Markdown)',
  gallery: 'Витрина иллюстраций / скриншотов',
  achievements: 'Витрина достижений',
  inventory: 'Витрина предметов / инвентаря',
  favorite: 'Любимый контент (баннер)',
  stats: 'Витрина статистики',
};

/* ═══ Мини-Markdown рендер: **жирный**, *курсив*, [ссылка](url), ==спойлер== ═══ */
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderMarkdown(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => {
      if (!p.trim()) return '';
      const inline = escapeHtml(p)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:hsl(265,80%,70%);text-decoration:underline">$1</a>')
        .replace(/==([^=]+)==/g, '<span class="rxp-spoiler">$1</span>')
        .replace(/\n/g, '<br/>');
      return '<p style="margin-bottom:.75rem">' + inline + '</p>';
    })
    .join('');
}

/* ═══ Загрузка файла в Supabase Storage ═══ */
const MEDIA_BUCKET = 'profile-media';

export async function uploadProfileMedia(userId: string, file: File): Promise<string> {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const UploadButton = ({
  userId,
  accept = 'image/*',
  onUploaded,
}: {
  userId: string;
  accept?: string;
  onUploaded: (url: string) => void;
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    try {
      setUploading(true);
      const url = await uploadProfileMedia(userId, file);
      onUploaded(url);
      toast.success('Файл загружен');
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.message?.includes('Bucket not found')
          ? 'Бакет profile-media не создан — выполните миграцию storage_profile_media.sql'
          : e?.message?.includes('row-level security') || e?.message?.includes('Unauthorized')
            ? 'Нет прав на загрузку — проверьте политики бакета'
            : 'Ошибка загрузки файла'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <label className="inline-flex">
      <input
        type="file"
        accept={accept}
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
      <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-transparent text-sm font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        Загрузить
      </span>
    </label>
  );
};

/* ═══ Props ═══ */
interface ProfileSettingsEditorProps {
  userId: string;
  open: boolean;
  onClose: () => void;
  initial: ProfileCustomizationData;
  onSaved: () => void;
}

type TabKey = 'avatar' | 'background' | 'theme' | 'about' | 'showcase' | 'awards' | 'fav' | 'url';

const ProfileSettingsEditor = ({ userId, open, onClose, initial, onSaved }: ProfileSettingsEditorProps) => {
  const [tab, setTab] = useState<TabKey>('avatar');
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState('');

  const [data, setData] = useState<ProfileCustomizationData>(initial);

  useEffect(() => {
    if (open) {
      setData({ ...initial });
      // Загружаем slug
      supabase
        .from('profiles')
        .select('custom_slug')
        .eq('id', userId)
        .single()
        .then(({ data: d }) => setSlug(d?.custom_slug || ''));
    }
  }, [open]);

  const set = <K extends keyof ProfileCustomizationData>(key: K, value: ProfileCustomizationData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const blocks = [...(data.showcase || [])];
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return;
    [blocks[idx], blocks[target]] = [blocks[target], blocks[idx]];
    set('showcase', blocks);
  };

  const updateBlock = (idx: number, patch: Partial<ShowcaseBlock>) => {
    const blocks = [...(data.showcase || [])];
    blocks[idx] = { ...blocks[idx], ...patch };
    set('showcase', blocks);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const patch: Record<string, any> = {
        avatar_frame_url: data.avatar_frame_url || null,
        background_url: data.background_url || null,
        background_type: data.background_type || 'image',
        theme: data.theme || 'dark',
        accent_color: data.accent_color || null,
        about_me: data.about_me || null,
        banner_url: data.banner_url || null,
        gallery_images: data.gallery_images || [],
        achievements: (data.achievements || []).filter((a) => a.title.trim()),
        favorite_content: data.favorite_content?.title?.trim() ? data.favorite_content : null,
        showcase: data.showcase || [],
      };

      const trimmedSlug = slug.trim().toLowerCase();
      if (trimmedSlug) {
        if (!/^[a-z0-9_-]{3,30}$/.test(trimmedSlug)) {
          toast.error('Ссылка: 3–30 символов, только a-z, 0-9, _ и -');
          return;
        }
        patch.custom_slug = trimmedSlug;
      } else {
        patch.custom_slug = null;
      }

      const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
      if (error) throw error;

      toast.success('Профиль сохранён!');
      onSaved();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message?.includes('custom_slug') ? 'Эта ссылка уже занята' : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const ensureBlocks = (): ShowcaseBlock[] => {
    const existing = data.showcase || [];
    // Добавляем новые типы блоков, если их нет
    return ALL_BLOCKS.filter(
      (def) => !existing.some((b) => b.type === def.type)
    ).concat(existing.length ? existing : []);
  };

  const blocks = ensureBlocks();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Настройка профиля</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto">
            <TabsTrigger value="avatar">Аватар</TabsTrigger>
            <TabsTrigger value="background">Фон</TabsTrigger>
            <TabsTrigger value="theme">Тема</TabsTrigger>
            <TabsTrigger value="about">О себе</TabsTrigger>
            <TabsTrigger value="showcase">Витрины</TabsTrigger>
            <TabsTrigger value="awards">Достижения</TabsTrigger>
            <TabsTrigger value="fav">Любимое</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>

          {/* ═══ АВАТАР + РАМКА ═══ */}
          <TabsContent value="avatar" className="overflow-y-auto space-y-4 pt-4">
            <div className="flex items-center gap-5">
              {/* Превью аватара с рамкой */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <img
                  src={initial.avatar_url || undefined}
                  alt=""
                  className="w-full h-full rounded-full object-cover border border-border"
                  onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0.15')}
                />
                {data.avatar_frame_url && (
                  <img
                    src={data.avatar_frame_url}
                    alt=""
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ transform: 'scale(1.35)' }}
                  />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">Рамка аватара (GIF/APNG поддерживаются)</p>
                <Input
                  placeholder="https://... ссылка на рамку (png/gif)"
                  value={data.avatar_frame_url || ''}
                  onChange={(e) => set('avatar_frame_url', e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <UploadButton
                    userId={userId}
                    accept="image/*"
                    onUploaded={(url) => set('avatar_frame_url', url)}
                  />
                  <Button variant="ghost" size="sm" onClick={() => set('avatar_frame_url', null)}>
                    Убрать рамку
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Мини-профиль (фон всплывающей карточки)</p>
              <Input
                placeholder="https://... фон мини-профиля"
                value={data.customization?.miniBackground || ''}
                onChange={(e) =>
                  set('customization', { ...data.customization, miniBackground: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Мини-профиль показывается при наведении на ник в комментариях.
              </p>
            </div>
          </TabsContent>

          {/* ═══ ФОН ПРОФИЛЯ ═══ */}
          <TabsContent value="background" className="overflow-y-auto space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Фон профиля — обои на весь экран</p>
              <div className="flex gap-2">
                <Button
                  variant={data.background_type === 'image' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => set('background_type', 'image')}
                >
                  <ImagePlus className="w-4 h-4 mr-1" /> Картинка / GIF
                </Button>
                <Button
                  variant={data.background_type === 'video' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => set('background_type', 'video')}
                >
                  <Video className="w-4 h-4 mr-1" /> Видео (mp4)
                </Button>
              </div>
              <Input
                placeholder={
                  data.background_type === 'video'
                    ? 'https://... ссылка на mp4 видео'
                    : 'https://... ссылка на картинку или gif'
                }
                value={data.background_url || ''}
                onChange={(e) => set('background_url', e.target.value)}
              />
              <UploadButton
                userId={userId}
                accept={data.background_type === 'video' ? 'video/mp4' : 'image/*'}
                onUploaded={(url) => set('background_url', url)}
              />
            </div>

            {data.background_url && (
              <div className="relative h-40 rounded-xl overflow-hidden border">
                {data.background_type === 'video' ? (
                  <video src={data.background_url} autoPlay muted loop className="w-full h-full object-cover" />
                ) : (
                  <img src={data.background_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Прозрачность центрального блока: {Math.round(((data.customization?.bgOpacity ?? 0.85) as number) * 100)}%</p>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(((data.customization?.bgOpacity ?? 0.85) as number) * 100)}
                onChange={(e) =>
                  set('customization', { ...data.customization, bgOpacity: Number(e.target.value) / 100 })
                }
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Чем меньше — тем прозрачнее блоки контента поверх фона.</p>
            </div>
          </TabsContent>

          {/* ═══ ТЕМА ═══ */}
          <TabsContent value="theme" className="overflow-y-auto space-y-4 pt-4">
            <p className="text-sm font-medium">Цветовая схема профиля</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    set('theme', t.id);
                    set('accent_color', t.accent);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    data.theme === t.id
                      ? 'border-primary bg-primary/10 shadow-lg'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <div className="text-sm font-medium">{t.label}</div>
                  <div
                    className="h-2 rounded-full mt-2 mx-auto w-12"
                    style={{ backgroundColor: t.accent }}
                  />
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Акцентный цвет (кнопки, плашки, ссылки)</p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={data.accent_color || '#a78bfa'}
                  onChange={(e) => set('accent_color', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer bg-transparent"
                />
                <Input
                  value={data.accent_color || ''}
                  onChange={(e) => set('accent_color', e.target.value)}
                  placeholder="#a78bfa"
                  className="w-32"
                />
              </div>
            </div>
          </TabsContent>

          {/* ═══ О СЕБЕ ═══ */}
          <TabsContent value="about" className="overflow-y-auto space-y-4 pt-4">
            <p className="text-sm font-medium">О себе — поддерживается Markdown:</p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>**жирный** · *курсив* · ==спойлер== · [текст](https://ссылка)</p>
            </div>
            <Textarea
              rows={7}
              placeholder={'Привет! Люблю **кино 90-х**.\n==Спойлер: он был прав=='}
              value={data.about_me || ''}
              onChange={(e) => set('about_me', e.target.value)}
            />
            {data.about_me && (
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground mb-2">Предпросмотр:</p>
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(data.about_me) }} />
              </div>
            )}
          </TabsContent>

          {/* ═══ ВИТРИНЫ ═══ */}
          <TabsContent value="showcase" className="overflow-y-auto space-y-3 pt-4">
            <p className="text-sm text-muted-foreground">
              Порядок отображения блоков на профиле. Приватность: «Все», «Друзья» или «Скрыто».
            </p>
            {(data.gallery_images || []).length > 0 && (
              <div className="rounded-xl border p-3">
                <p className="text-sm font-medium mb-2">
                  Изображения витрины ({data.gallery_images!.length}) — URL по одному:
                </p>
                <div className="space-y-2">
                  {data.gallery_images!.map((img, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <img src={img} alt="" className="w-10 h-10 rounded object-cover border" />
                      <span className="text-xs truncate flex-1 text-muted-foreground">{img}</span>
                      <button
                        onClick={() =>
                          set(
                            'gallery_images',
                            data.gallery_images!.filter((_, j) => j !== i)
                          )
                        }
                        className="text-destructive text-xs hover:underline"
                      >
                        удалить
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 items-start">
              <AddGalleryImage
                onAdd={(url) => set('gallery_images', [...(data.gallery_images || []), url])}
              />
              <UploadButton
                userId={userId}
                accept="image/*"
                onUploaded={(url) => set('gallery_images', [...(data.gallery_images || []), url])}
              />
            </div>

            <div className="space-y-2">
              {blocks.map((block, i) => (
                <div key={block.type} className="flex items-center gap-2 p-3 rounded-xl border">
                  <div className="flex flex-col">
                    <button onClick={() => moveBlock(i, -1)} disabled={i === 0}>
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1}>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="flex-1 text-sm min-w-0 truncate">{BLOCK_LABELS[block.type] || block.type}</span>

                  {/* Видимость */}
                  <select
                    value={block.visibility}
                    onChange={(e) => updateBlock(i, { visibility: e.target.value as ShowcaseBlock['visibility'] })}
                    className="bg-muted/50 border rounded-lg px-2 py-1 text-xs cursor-pointer"
                  >
                    <option value="all">Все</option>
                    <option value="friends">Друзья</option>
                    <option value="hidden">Скрыто</option>
                  </select>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ═══ ДОСТИЖЕНИЯ ═══ */}
          <TabsContent value="awards" className="overflow-y-auto space-y-3 pt-4">
            <p className="text-sm text-muted-foreground">
              Витрина достижений: иконка (эмодзи), название и описание.
            </p>
            {(data.achievements || []).map((a, i) => (
              <div key={i} className="p-3 rounded-xl border space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="🏆"
                    value={a.icon || ''}
                    onChange={(e) => {
                      const list = [...(data.achievements || [])];
                      list[i] = { ...a, icon: e.target.value };
                      set('achievements', list);
                    }}
                    className="w-16 text-center"
                    maxLength={4}
                  />
                  <Input
                    placeholder="Название достижения"
                    value={a.title}
                    onChange={(e) => {
                      const list = [...(data.achievements || [])];
                      list[i] = { ...a, title: e.target.value };
                      set('achievements', list);
                    }}
                  />
                  <button
                    onClick={() =>
                      set(
                        'achievements',
                        data.achievements!.filter((_, j) => j !== i)
                      )
                    }
                    className="p-2 text-destructive hover:bg-destructive/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Textarea
                  rows={2}
                  placeholder="Описание (необязательно)"
                  value={a.description || ''}
                  onChange={(e) => {
                    const list = [...(data.achievements || [])];
                    list[i] = { ...a, description: e.target.value };
                    set('achievements', list);
                  }}
                />
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() =>
                set('achievements', [...(data.achievements || []), { title: '', icon: '🏆' }])
              }
            >
              <Plus className="w-4 h-4" />
              Добавить достижение
            </Button>
          </TabsContent>

          {/* ═══ ЛЮБИМЫЙ КОНТЕНТ ═══ */}
          <TabsContent value="fav" className="overflow-y-auto space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Любимый контент — баннер с изображением и ссылкой.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Название</p>
              <Input
                placeholder="Например: Интерстеллар"
                value={data.favorite_content?.title || ''}
                onChange={(e) =>
                  set('favorite_content', {
                    ...(data.favorite_content || { title: '' }),
                    title: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Изображение баннера</p>
              <Input
                placeholder="https://... ссылка на картинку"
                value={data.favorite_content?.image_url || ''}
                onChange={(e) =>
                  set('favorite_content', {
                    ...(data.favorite_content || { title: '' }),
                    image_url: e.target.value,
                  })
                }
              />
              <UploadButton
                userId={userId}
                accept="image/*"
                onUploaded={(url) =>
                  set('favorite_content', {
                    ...(data.favorite_content || { title: '' }),
                    image_url: url,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Ссылка (необязательно)</p>
              <Input
                placeholder="https://... куда ведёт клик по баннеру"
                value={data.favorite_content?.url || ''}
                onChange={(e) =>
                  set('favorite_content', {
                    ...(data.favorite_content || { title: '' }),
                    url: e.target.value,
                  })
                }
              />
            </div>
            {data.favorite_content?.image_url && (
              <div className="relative h-40 rounded-xl overflow-hidden border">
                <img
                  src={data.favorite_content.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {data.favorite_content?.title && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <span className="text-white font-semibold">{data.favorite_content.title}</span>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ═══ URL ═══ */}
          <TabsContent value="url" className="overflow-y-auto space-y-4 pt-4">
            <p className="text-sm font-medium">Кастомная ссылка на профиль</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">…/id/</span>
              <Input
                placeholder="my_nickname"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              3–30 символов: латиница, цифры, _ и -. Профиль будет доступен по адресу:
            </p>
            <code className="block px-3 py-2 rounded-lg bg-muted/60 text-xs break-all">
              {window.location.origin}/id/{slug || 'your_name'}
            </code>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* Вспомогательный инпут добавления картинки в галерею */
const AddGalleryImage = ({ onAdd }: { onAdd: (url: string) => void }) => {
  const [url, setUrl] = useState('');
  return (
    <div className="flex gap-2">
      <Input
        placeholder="https://... добавить изображение в витрину"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && url.trim()) {
            onAdd(url.trim());
            setUrl('');
          }
        }}
      />
      <Button
        variant="outline"
        onClick={() => {
          if (url.trim()) {
            onAdd(url.trim());
            setUrl('');
          }
        }}
      >
        <ImagePlus className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ProfileSettingsEditor;
