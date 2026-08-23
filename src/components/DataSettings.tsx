import { useRef, useState } from 'react';
import { Download, Upload, Languages, FileSpreadsheet, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { useBookmarks } from '@/context/BookmarkContext';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';
import { ContentStatus, ContentType } from '@/types/anime';

const LANGS = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'kk', label: 'Қазақша', flag: '🇰🇿' },
];

function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '');
          return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',')
    )
    .join('\n');
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell); cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled';
}

const STATUS_MAP: Record<string, ContentStatus> = {
  watched: 'watched', просмотрено: 'watched',
  watching: 'watching', 'смотрю': 'watching',
  planned: 'planned', 'в планах': 'planned',
  dropped: 'dropped', брошено: 'dropped',
  postponed: 'postponed', отложено: 'postponed',
  favorite: 'favorite', избранное: 'favorite',
};

export default function DataSettings() {
  const { language, setLanguage } = useLanguage();
  const { refresh } = useBookmarks();
  const fileRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState<number | null>(null);

  const exportBookmarks = async () => {
    setExporting('bookmarks');
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('no user');
      const { data, error } = await supabase
        .from('content_bookmarks')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;

      const rows: (string | number)[][] = [['Type', 'Title', 'Year', 'Status', 'MyRating', 'ExternalRating', 'Genre', 'Notes']];
      for (const b of data || []) {
        rows.push([
          b.content_type, b.title, b.release_year || '', b.status,
          b.user_rating || '', b.external_rating || '', b.genre || '', b.notes || '',
        ]);
      }
      downloadCsv(`reversex-bookmarks-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
      toast.success(`Экспортировано закладок: ${rows.length - 1}`);
    } catch (e) {
      console.error(e);
      toast.error('Ошибка экспорта закладок');
    } finally {
      setExporting(null);
    }
  };

  const exportTop50 = async () => {
    setExporting('top50');
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('no user');

      const { data: lists } = await supabase
        .from('top_lists')
        .select('id, title, media_type')
        .eq('user_id', userData.user.id);
      if (!lists || lists.length === 0) {
        toast.info('Топ-50 списки пусты');
        setExporting(null);
        return;
      }

      const { data: items } = await supabase
        .from('top_list_items')
        .select('top_list_id, rank, title, item_id')
        .in('top_list_id', lists.map((l: any) => l.id))
        .order('rank', { ascending: true });

      const listById = Object.fromEntries(lists.map((l: any) => [l.id, l]));
      const rows: (string | number)[][] = [['List', 'MediaType', 'Rank', 'Title']];
      for (const it of items || []) {
        const list = listById[it.top_list_id];
        rows.push([list?.title || '', list?.media_type || '', it.rank, it.title]);
      }
      downloadCsv(`reversex-top50-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
      toast.success(`Экспортировано позиций: ${rows.length - 1}`);
    } catch (e) {
      console.error(e);
      toast.error('Ошибка экспорта Топ-50');
    } finally {
      setExporting(null);
    }
  };

  const importCsv = async (file: File) => {
    setImporting(true);
    setImportDone(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('no user');
      const userId = userData.user.id;

      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) {
        toast.error('CSV пустой');
        return;
      }

      const header = rows[0].map((h) => h.trim().toLowerCase());
      const col = (...names: string[]) => header.findIndex((h) => names.includes(h));

      // Letterboxd: Date,Name,Year,Letterboxd URI,Rating
      const iName = col('name', 'title', 'фильм', 'название');
      const iYear = col('year', 'год');
      const iUri = col('letterboxd uri', 'uri', 'url', 'ссылка');
      const iRating = col('rating', 'myrating', 'оценка', 'рейтинг');
      const iType = col('type', 'тип');
      const iStatus = col('status', 'статус');

      if (iName < 0) {
        toast.error('Не найдена колонка Name/Title/Название');
        return;
      }

      let imported = 0;
      let skipped = 0;

      for (const row of rows.slice(1)) {
        const title = (row[iName] || '').trim();
        if (!title) { skipped++; continue; }
        const year = iYear >= 0 ? (row[iYear] || '').trim() : '';
        const uri = iUri >= 0 ? (row[iUri] || '').trim() : '';
        const ratingRaw = iRating >= 0 ? (row[iRating] || '').trim().replace(',', '.') : '';
        const rating = ratingRaw && !isNaN(parseFloat(ratingRaw)) ? parseFloat(ratingRaw) : 0;
        const typeRaw = iType >= 0 ? (row[iType] || '').trim().toLowerCase() : '';
        const contentType: ContentType =
          typeRaw.startsWith('serie') || typeRaw.startsWith('сериал') || typeRaw === 'tv' ? 'series'
          : typeRaw.startsWith('game') || typeRaw.startsWith('игр') ? 'game'
          : 'movie';
        const statusRaw = iStatus >= 0 ? (row[iStatus] || '').trim().toLowerCase() : '';
        const status: ContentStatus = STATUS_MAP[statusRaw] || 'watched';

        // content_id: slug из Letterboxd URI, иначе из названия+года
        let contentId = `csv:${slugify(title)}${year ? `-${year}` : ''}`;
        if (uri) {
          const m = uri.match(/letterboxd\.com\/film\/([^/]+)/i);
          if (m) contentId = `lb:${m[1]}`;
        }

        const { error } = await supabase.from('content_bookmarks').upsert(
          {
            user_id: userId,
            content_type: contentType,
            content_id: contentId,
            title,
            status,
            is_favorite: false,
            user_rating: rating,
            progress: 0,
            total_items: 0,
            release_year: year || null,
          },
          { onConflict: 'user_id,content_id,content_type' }
        );
        if (error) { console.warn('Row skip:', error.message); skipped++; }
        else imported++;
      }

      setImportDone(imported);
      await refresh();
      if (imported > 0) toast.success(`Импортировано: ${imported}${skipped ? ` · пропущено: ${skipped}` : ''}`);
      else toast.error('Ничего не импортировано');
    } catch (e) {
      console.error(e);
      toast.error('Ошибка импорта CSV');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Язык системы ─── */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-primary" />
            Язык системы
          </CardTitle>
          <CardDescription>Выберите язык интерфейса</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                  language === l.code
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white border-transparent shadow-lg shadow-purple-500/25'
                    : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="text-lg">{l.flag}</span>
                {l.label}
                {language === l.code && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Экспорт ─── */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Экспорт данных
          </CardTitle>
          <CardDescription>Скачайте свои закладки и Топ-50 в CSV</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button onClick={exportBookmarks} disabled={exporting !== null} className="gap-2 flex-1">
            {exporting === 'bookmarks' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Закладки (CSV)
          </Button>
          <Button onClick={exportTop50} disabled={exporting !== null} variant="outline" className="gap-2 flex-1">
            {exporting === 'top50' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Топ-50 (CSV)
          </Button>
        </CardContent>
      </Card>

      {/* ─── Импорт ─── */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Импорт CSV
          </CardTitle>
          <CardDescription>
            Поддерживается экспорт Letterboxd (Date, Name, Year, Letterboxd URI, Rating)
            и общий формат (Title/Название, Year/Год, Type, Status, Rating).
            Фильмы добавятся в закладки со статусом «Просмотрено».
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importCsv(f);
            }}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            variant="outline"
            className="w-full gap-2"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? 'Импортирую...' : 'Выбрать CSV файл'}
          </Button>
          {importDone !== null && !importing && (
            <p className="text-sm text-emerald-500 mt-3 text-center">
              ✓ Импортировано записей: {importDone}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
