import { createWorker, OEM, PSM } from 'tesseract.js';
import workerPath from 'tesseract.js/dist/worker.min.js?url';
import corePath from 'tesseract.js-core/tesseract-core-lstm.wasm.js?url';

type Box = { x: number; y: number; w: number; h: number };
export type PhotoVote = { season: number | null; episode: string; score: string };

function canvas(w: number, h: number) {
  const el = document.createElement('canvas');
  el.width = Math.max(1, w);
  el.height = Math.max(1, h);
  return el.getContext('2d', { willReadFrequently: true })!;
}

// Find solid, saturated rectangles even when JPEG compression shifts their RGB values.
function tiles({ data, width, height }: ImageData): Box[] {
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < mask.length; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    mask[i] = Number(Math.max(r, g, b) - Math.min(r, g, b) > 44);
  }
  const stack = new Int32Array(mask.length);
  const boxes: Box[] = [];
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    let size = 1;
    let count = 0;
    let left = width;
    let top = height;
    let right = 0;
    let bottom = 0;
    stack[0] = i;
    mask[i] = 0;
    while (size) {
      const pos = stack[--size];
      const x = pos % width;
      const y = Math.floor(pos / width);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      count++;
      for (const next of [x ? pos - 1 : -1, x + 1 < width ? pos + 1 : -1, pos - width, pos + width]) {
        if (next >= 0 && next < mask.length && mask[next]) {
          mask[next] = 0;
          stack[size++] = next;
        }
      }
    }
    const w = right - left + 1;
    const h = bottom - top + 1;
    if (h >= 16 && w >= 26 && w / h > 1.1 && w / h < 3.5 && count > 0.55 * w * h) {
      boxes.push({ x: left, y: top, w, h });
    }
  }
  const counts = new Map<string, number>();
  for (const b of boxes) {
    const key = Math.round(b.w / 5) + ',' + Math.round(b.h / 5);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const common = [...counts].sort((a, b) => b[1] - a[1])[0];
  if (!common) return [];
  const [w, h] = common[0].split(',').map((v) => Number(v) * 5);
  return boxes
    .filter((b) => Math.abs(b.w - w) <= Math.max(5, w * 0.12) && Math.abs(b.h - h) <= Math.max(5, h * 0.12))
    .sort((a, b) => (Math.abs(a.y - b.y) < h * 0.35 ? a.x - b.x : a.y - b.y));
}

function medianColorFromPerimeter(source: ImageData, box: Box): [number, number, number] {
  const { x, y, w, h } = box;
  const offset = (dx: number, dy: number) => ((y + dy) * source.width + x + dx) * 4;
  const xMin = Math.max(1, Math.round(w * 0.08));
  const xMax = Math.min(w - 2, Math.round(w * 0.92));
  const yMin = Math.max(1, Math.round(h * 0.08));
  const yMax = Math.min(h - 2, Math.round(h * 0.92));

  const channels: [number[], number[], number[]] = [[], [], []];
  const push = (dx: number, dy: number) => {
    const p = offset(dx, dy);
    channels[0].push(source.data[p]);
    channels[1].push(source.data[p + 1]);
    channels[2].push(source.data[p + 2]);
  };

  for (let s = 0; s <= 6; s++) {
    const dx = Math.round(xMin + ((xMax - xMin) * s) / 6);
    push(dx, yMin);
    push(dx, yMax);
  }
  for (let s = 1; s <= 5; s++) {
    const dy = Math.round(yMin + ((yMax - yMin) * s) / 6);
    push(xMin, dy);
    push(xMax, dy);
  }

  return channels.map((arr) => {
    arr.sort((a, b) => a - b);
    return arr[Math.floor(arr.length / 2)] ?? 0;
  }) as [number, number, number];
}

function extractTextCanvas(
  source: ImageData,
  rect: Box,
  bg: [number, number, number],
  targetHeight = 64,
  pad = 16,
  threshold = 24
) {
  const part = canvas(rect.w, rect.h);
  const out = part.createImageData(rect.w, rect.h);
  for (let dy = 0; dy < rect.h; dy++) {
    for (let dx = 0; dx < rect.w; dx++) {
      const p = ((rect.y + dy) * source.width + rect.x + dx) * 4;
      const diff = Math.max(
        Math.abs(source.data[p] - bg[0]),
        Math.abs(source.data[p + 1] - bg[1]),
        Math.abs(source.data[p + 2] - bg[2])
      );
      const j = (dy * rect.w + dx) * 4;
      const gray = diff < threshold ? 255 : Math.max(0, Math.round(255 - (diff - threshold) * 3.5));
      out.data[j] = gray;
      out.data[j + 1] = gray;
      out.data[j + 2] = gray;
      out.data[j + 3] = 255;
    }
  }
  part.putImageData(out, 0, 0);
  const width = Math.max(1, Math.ceil((rect.w * targetHeight) / rect.h));
  const line = canvas(width + pad * 2, targetHeight + pad * 2);
  line.fillStyle = 'white';
  line.fillRect(0, 0, line.canvas.width, line.canvas.height);
  line.imageSmoothingEnabled = true;
  line.imageSmoothingQuality = 'high';
  line.drawImage(part.canvas, pad, pad, width, targetHeight);
  return line.canvas;
}

// Wrapped cards have two text rows inside each tile (E# top-left, score bottom).
function tileField(source: ImageData, box: Box, field: 'label' | 'score') {
  const { x, y, w, h } = box;
  const bg = medianColorFromPerimeter(source, box);
  const label = field === 'label';
  const left = Math.round(w * (label ? 0.05 : 0.08));
  const top = Math.round(h * (label ? 0.05 : 0.42));
  const right = Math.round(w * (label ? 0.65 : 0.96));
  const bottom = Math.round(h * (label ? 0.39 : 0.94));
  return extractTextCanvas(
    source,
    { x: x + left, y: y + top, w: Math.max(1, right - left), h: Math.max(1, bottom - top) },
    bg,
    56,
    12,
    24
  );
}

// Grid cells contain only one large centered score.
function gridScoreImage(source: ImageData, box: Box) {
  const { x, y, w, h } = box;
  const bg = medianColorFromPerimeter(source, box);
  const left = Math.round(w * 0.05);
  const top = Math.round(h * 0.08);
  const right = Math.round(w * 0.95);
  const bottom = Math.round(h * 0.92);
  return extractTextCanvas(
    source,
    { x: x + left, y: y + top, w: Math.max(1, right - left), h: Math.max(1, bottom - top) },
    bg,
    64,
    16,
    26
  );
}

// Convert dark/light UI label regions (like S1, S2, E1..E22) to crisp black-on-white.
function uiLabelImage(source: ImageData, rect: Box) {
  const x = Math.max(0, rect.x);
  const y = Math.max(0, rect.y);
  const w = Math.min(source.width - x, rect.w);
  const h = Math.min(source.height - y, rect.h);
  if (w <= 0 || h <= 0) return canvas(10, 10).canvas;

  const ch: [number[], number[], number[]] = [[], [], []];
  const stepX = Math.max(1, Math.floor(w / 12));
  const stepY = Math.max(1, Math.floor(h / 8));
  for (let dy = 0; dy < h; dy += stepY) {
    for (let dx = 0; dx < w; dx += stepX) {
      const p = ((y + dy) * source.width + x + dx) * 4;
      ch[0].push(source.data[p]);
      ch[1].push(source.data[p + 1]);
      ch[2].push(source.data[p + 2]);
    }
  }
  const bg = ch.map((arr) => {
    arr.sort((a, b) => a - b);
    return arr[Math.floor(arr.length / 2)] ?? 0;
  }) as [number, number, number];

  return extractTextCanvas(source, { x, y, w, h }, bg, 56, 16, 22);
}

function parseScore(rawText: string): string {
  const cleaned = rawText
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/\.+/g, '.');

  const exact = cleaned.match(/^(10\.0|[1-9]\.\d)$/);
  if (exact) return exact[1];

  if (cleaned === '100') return '10.0';

  const twoDigits = cleaned.match(/^([1-9])(\d)$/);
  if (twoDigits) return `${twoDigits[1]}.${twoDigits[2]}`;

  const whole = cleaned.match(/^(10|[1-9])$/);
  if (whole) return `${whole[1]}.0`;

  const embedded = cleaned.match(/(10\.0|[1-9]\.\d)/);
  if (embedded) return embedded[1];

  return '';
}

function isGridLayout(source: ImageData, boxes: Box[]): boolean {
  if (boxes.length < 2) return false;
  const sample = boxes.slice(0, Math.min(8, boxes.length));
  let midHits = 0;
  let midTotal = 0;
  let gapHits = 0;
  let gapTotal = 0;

  for (const b of sample) {
    const bg = medianColorFromPerimeter(source, b);
    // Center band (where a centered grid score has heavy strokes; Wrapped has an empty gap ~38-44%)
    const y0 = Math.round(b.h * 0.34);
    const y1 = Math.round(b.h * 0.45);
    const x0 = Math.round(b.w * 0.22);
    const x1 = Math.round(b.w * 0.78);
    for (let dy = y0; dy <= y1; dy++) {
      for (let dx = x0; dx <= x1; dx++) {
        const p = ((b.y + dy) * source.width + b.x + dx) * 4;
        const diff = Math.max(
          Math.abs(source.data[p] - bg[0]),
          Math.abs(source.data[p + 1] - bg[1]),
          Math.abs(source.data[p + 2] - bg[2])
        );
        midTotal++;
        if (diff > 28) midHits++;
        if (dy >= Math.round(b.h * 0.37) && dy <= Math.round(b.h * 0.43)) {
          gapTotal++;
          if (diff > 28) gapHits++;
        }
      }
    }
  }

  const midDensity = midTotal > 0 ? midHits / midTotal : 0;
  const gapDensity = gapTotal > 0 ? gapHits / gapTotal : 0;
  return midDensity > 0.07 && gapDensity > 0.05;
}

function clusterByAxis(values: number[], tol: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const clusters: number[][] = [];
  for (const v of sorted) {
    const last = clusters[clusters.length - 1];
    if (last && Math.abs(v - last[0]) <= tol) {
      last.push(v);
    } else {
      clusters.push([v]);
    }
  }
  return clusters.map((c) => Math.round(c.reduce((a, b) => a + b, 0) / c.length));
}

function nearestIndex(centers: number[], val: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < centers.length; i++) {
    const d = Math.abs(centers[i] - val);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

export async function readSeriesGraph(file: File, progress: (message: string) => void) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / bitmap.width, 3600 / bitmap.height);
  const ctx = canvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
  ctx.drawImage(bitmap, 0, 0, ctx.canvas.width, ctx.canvas.height);
  bitmap.close();

  const pixels = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const boxes = tiles(pixels);
  if (!boxes.length) {
    throw new Error('Не найдены цветные карточки. Загрузите скриншот из SeriesGraph (таблица по сезонам или режим Wrapped).');
  }

  const worker = await createWorker('eng', OEM.LSTM_ONLY, {
    langPath: new URL(import.meta.env.BASE_URL + 'ocr/', location.origin).href,
    workerPath: new URL(workerPath, location.href).href,
    corePath: new URL(corePath, location.href).href,
  });

  try {
    async function readArea(x: number, y: number, w: number, h: number) {
      const area = canvas(w * 2, h * 2);
      area.drawImage(ctx.canvas, x, y, w, h, 0, 0, w * 2, h * 2);
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT, tessedit_char_whitelist: '' });
      return (await worker.recognize(area.canvas)).data.text;
    }

    const address = await readArea(0, 0, ctx.canvas.width, Math.min(60, ctx.canvas.height));
    const showId = address.match(/seriesgraph\.com\s*\/\s*show\s*\/\s*(\d+)/i)?.[1];

    // ── Режим 1: стандартная сетка SeriesGraph (колонки S1, S2... и строки E1, E2...) ──
    if (isGridLayout(pixels, boxes)) {
      const avgW = boxes.reduce((a, b) => a + b.w, 0) / boxes.length;
      const avgH = boxes.reduce((a, b) => a + b.h, 0) / boxes.length;

      const colCenters = clusterByAxis(
        boxes.map((b) => b.x),
        avgW * 0.45
      );
      const rowCenters = clusterByAxis(
        boxes.map((b) => b.y),
        avgH * 0.45
      );

      // 1. Определяем номера сезонов над каждой колонкой
      progress('Определяем сезоны и серии…');
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
        tessedit_char_whitelist: 'S0123456789',
      });

      const colSeasons: Array<number | null> = [];
      for (let c = 0; c < colCenters.length; c++) {
        const colBoxes = boxes.filter((b) => nearestIndex(colCenters, b.x) === c);
        const topBox = colBoxes.sort((a, b) => a.y - b.y)[0];
        if (!topBox || topBox.y < 10) {
          colSeasons.push(null);
          continue;
        }
        const hy = Math.max(0, topBox.y - Math.round(avgH * 1.05));
        const hh = Math.max(1, topBox.y - hy - 2);
        const hx = Math.max(0, topBox.x - Math.round(avgW * 0.25));
        const hw = Math.round(avgW * 1.5);
        const img = uiLabelImage(pixels, { x: hx, y: hy, w: hw, h: hh });
        const text = (await worker.recognize(img)).data.text.trim();
        const m = text.match(/S\s*(\d+)/i);
        colSeasons.push(m ? Number(m[1]) : null);
      }

      // Восстанавливаем пропущенные заголовки сезонов по последовательности колонок
      const firstKnownCol = colSeasons.findIndex((s) => s !== null);
      if (firstKnownCol === -1) {
        for (let c = 0; c < colCenters.length; c++) colSeasons[c] = c + 1;
      } else {
        const base = colSeasons[firstKnownCol]! - firstKnownCol;
        for (let c = 0; c < colCenters.length; c++) {
          if (colSeasons[c] === null) colSeasons[c] = Math.max(1, base + c);
        }
      }

      // 2. Определяем номера серий слева от каждой строки
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
        tessedit_char_whitelist: 'E0123456789',
      });

      const rawRowEpisodes: Array<number | null> = [];
      const firstColX = colCenters[0];
      if (firstColX > 12) {
        const lx = Math.max(0, firstColX - Math.round(avgW * 1.65));
        const lw = Math.max(1, firstColX - lx - 3);
        for (let r = 0; r < rowCenters.length; r++) {
          const ly = Math.max(0, rowCenters[r] - 2);
          const lh = Math.round(avgH + 4);
          const img = uiLabelImage(pixels, { x: lx, y: ly, w: lw, h: lh });
          const text = (await worker.recognize(img)).data.text.trim();
          const m = text.match(/E\s*(\d+)/i);
          rawRowEpisodes.push(m ? Number(m[1]) : null);
        }
      } else {
        for (let r = 0; r < rowCenters.length; r++) rawRowEpisodes.push(null);
      }

      // Вычисляем базовый сдвиг (обычно 1, т.к. строка 0 = E1) и чиним сбои OCR
      const offsetCounts = new Map<number, number>();
      rawRowEpisodes.forEach((ep, idx) => {
        if (ep !== null && ep >= 1) {
          const off = ep - idx;
          offsetCounts.set(off, (offsetCounts.get(off) ?? 0) + 1);
        }
      });
      const bestOffsetEntry = [...offsetCounts].sort((a, b) => b[1] - a[1])[0];
      const baseOffset = bestOffsetEntry ? bestOffsetEntry[0] : 1;

      const rowEpisodes = rawRowEpisodes.map((ep, idx) => {
        const expected = baseOffset + idx;
        if (ep === null) return String(Math.max(1, expected));
        // Если OCR прочитал очевидный сбой (например, E11 -> E1 или перескочил назад), берём expected
        if (Math.abs(ep - expected) > 0 && bestOffsetEntry && bestOffsetEntry[1] >= Math.max(2, Math.floor(rowCenters.length * 0.35))) {
          return String(Math.max(1, expected));
        }
        return String(ep);
      });

      // 3. Читаем балл в каждой ячейке сетки
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
        tessedit_char_whitelist: '0123456789.,',
      });

      const gridItems: Array<{ col: number; row: number; season: number; episode: string; score: string }> = [];
      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        const col = nearestIndex(colCenters, b.x);
        const row = nearestIndex(rowCenters, b.y);
        progress(`Читаем оценки: ${i + 1} из ${boxes.length}`);

        const img = gridScoreImage(pixels, b);
        const text = (await worker.recognize(img)).data.text.trim();
        const score = parseScore(text);

        gridItems.push({
          col,
          row,
          season: colSeasons[col] ?? col + 1,
          episode: rowEpisodes[row] ?? String(row + 1),
          score,
        });
      }

      // Сортируем по сезону и серии, чтобы таблица шла аккуратно: S1 E1..E22, затем S2 E1..E22
      gridItems.sort((a, b) => a.season - b.season || Number(a.episode) - Number(b.episode));

      return {
        showId: showId ? Number(showId) : null,
        votes: gridItems.map(({ season, episode, score }) => ({ season, episode, score })),
      };
    }

    // ── Режим 2: карточки SeriesGraph Wrapped (E# сверху слева, оценка снизу) ──
    const votes: PhotoVote[] = [];
    let lastBottom = -Infinity;
    let season: number | null = null;
    for (const b of boxes) {
      if (b.y - lastBottom > b.h * 0.55) {
        const top = Math.max(0, b.y - Math.round(b.h * 0.85));
        const heading =
          top < b.y
            ? await readArea(Math.max(0, b.x - 2), top, Math.min(ctx.canvas.width - b.x, Math.ceil(b.w * 3)), b.y - top)
            : '';
        const match = heading.match(/Season\s*(\d+)/i);
        season = match ? Number(match[1]) : null;
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_LINE,
          tessedit_char_whitelist: 'E0123456789.,',
          preserve_interword_spaces: '1',
        });
      }
      lastBottom = Math.max(lastBottom, b.y + b.h);
      progress(`Читаем оценки: ${votes.length + 1} из ${boxes.length}`);
      const labelImage = tileField(pixels, b, 'label');
      const scoreImage = tileField(pixels, b, 'score');
      const pair = canvas(labelImage.width + scoreImage.width, 80);
      pair.drawImage(labelImage, 0, 0);
      pair.drawImage(scoreImage, labelImage.width, 0);
      const combined = (await worker.recognize(pair.canvas)).data.text.trim();
      const combinedScore = combined.match(/(?:10[.,]0|[1-9][.,]\d)$/);
      const label = combinedScore ? combined.slice(0, combinedScore.index).trim() : combined;
      let episode = label.match(/^E\s*(\d+)$/i)?.[1];
      if (!episode) {
        const separate = (await worker.recognize(labelImage)).data.text.trim();
        episode = separate.match(/^E\s*(\d+)$/i)?.[1];
      }
      const isolated = (await worker.recognize(scoreImage)).data.text.trim();
      const score = parseScore(isolated) || (combinedScore ? combinedScore[0].replace(',', '.') : '');
      votes.push({ season, episode: episode ?? '', score });
    }
    // A repeated truncated label between E70 and E72 is E71, even if OCR read E7.
    const seen = new Set<string>();
    votes.forEach((vote, i) => {
      const prev = votes[i - 1];
      const next = votes[i + 1];
      if (
        prev?.episode &&
        next?.episode &&
        prev.season === vote.season &&
        next.season === vote.season &&
        Number(next.episode) === Number(prev.episode) + 2
      ) {
        const expected = String(Number(prev.episode) + 1);
        if (!vote.episode || (seen.has(vote.season + '/' + vote.episode) && expected.startsWith(vote.episode))) {
          vote.episode = expected;
        }
      }
      seen.add(vote.season + '/' + vote.episode);
    });
    return { showId: showId ? Number(showId) : null, votes };
  } finally {
    await worker.terminate();
  }
}
