import { Readable } from 'node:stream';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';

const day = 86_400_000;
let snapshot;
let refreshedAt = 0;
let refresh;

async function loadRatings() {
  const response = await fetch('https://datasets.imdbws.com/title.ratings.tsv.gz', {
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error('IMDb dataset unavailable');
  const source = Readable.fromWeb(response.body);
  const gzip = source.pipe(createGunzip());
  source.on('error', error => gzip.destroy(error));
  const lines = createInterface({ input: gzip, crlfDelay: Infinity });
  // Allocate one byte per title ID in pages, including only occupied pages.
  const pages = new Map();
  for await (const line of lines) {
    if (!line.startsWith('tt')) continue;
    const [title, score] = line.split('\t', 2);
    const id = Number(title.slice(2));
    const page = Math.floor(id / 65536);
    if (!pages.has(page)) pages.set(page, new Uint8Array(65536));
    pages.get(page)[id & 65535] = Math.round(Number(score) * 10);
  }
  if (!pages.size) throw new Error('Empty IMDb dataset');
  snapshot = pages;
  refreshedAt = Date.now();
}

export default async function episodeRating(req, res) {
  const id = new URL(req.url, 'http://localhost').searchParams.get('id');
  res.setHeader('Content-Type', 'application/json');
  if (!/^tt\d{7,10}$/.test(id || '')) {
    res.statusCode = 400;
    return res.end('{"error":"Invalid IMDb ID"}');
  }
  if (Date.now() - refreshedAt >= day) {
    refresh ??= loadRatings().finally(() => { refresh = undefined; });
    try { await refresh; } catch {
      if (!snapshot) {
        res.statusCode = 503;
        return res.end('{"error":"IMDb unavailable"}');
      }
    }
  }
  const key = Number(id.slice(2));
  const score = snapshot.get(Math.floor(key / 65536))?.[key & 65535];
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.end(JSON.stringify({ rating: score ? score / 10 : null }));
}
