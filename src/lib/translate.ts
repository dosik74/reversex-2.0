const translationCache = new Map<string, string>();

/** Режем длинный текст на куски, чтобы GET-запрос к Google не раздувался */
const splitChunks = (text: string, maxLen: number = 1000): string[] => {
  const parts = text.split(/\n\s*\n|(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + ' ' + p).trim().length > maxLen && cur) {
      chunks.push(cur.trim());
      cur = p;
    } else {
      cur = (cur + ' ' + p).trim();
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.length ? chunks : [text];
};

/**
 * Браузерный перевод через публичный Google-эндпоинт (CORS открыт).
 * Без Node-зависимостей — в отличие от пакета translatte, который
 * в браузере не работает (got/tunnel/querystring).
 */
export const translateGoogleFree = async (
  text: string,
  to: string = 'ru',
  from: string = 'en'
): Promise<string> => {
  if (!text?.trim()) return text;

  const chunks = splitChunks(text);
  const out: string[] = [];

  for (const chunk of chunks) {
    const url =
      'https://translate.googleapis.com/translate_a/single?' +
      new URLSearchParams({ client: 'gtx', sl: from, tl: to, dt: 't', q: chunk }).toString();
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google translate error: ${res.status}`);
    const data = await res.json();
    const translated = ((data?.[0] || []) as any[])
      .map((seg) => seg?.[0] || '')
      .join('');
    if (!translated.trim()) throw new Error('Google translate: empty response');
    out.push(translated);
  }

  return out.join('\n\n');
};

export const translateText = async (text: string, targetLanguage: string = 'ru'): Promise<string> => {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // Check cache first
  const cacheKey = `${text.substring(0, 100)}:${targetLanguage}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey) || text;
  }

  try {
    // Detect if text is already in target language or if it's too short
    if (text.length < 3) {
      translationCache.set(cacheKey, text);
      return text;
    }

    console.log(`Translating text (first 100 chars): ${text.substring(0, 100)}`);
    
    // Use dynamic import for ES module
    const translatte = (await import('translatte')).default;
    const result = await translatte(text, {
      from: 'en',
      to: targetLanguage,
    });
    
    const translatedText = result?.text || text;
    
    if (!translatedText) {
      console.warn('Translation returned empty result');
      return text;
    }
    
    // Cache the translation
    translationCache.set(cacheKey, translatedText);
    console.log(`Translation successful: ${translatedText.substring(0, 100)}`);
    
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text if translation fails
    return text;
  }
};

export const translateHtml = async (html: string, targetLanguage: string = 'ru'): Promise<string> => {
  if (!html || html.trim().length === 0) {
    return html;
  }

  try {
    // Strip HTML tags and translate
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const textContent = temp.textContent || temp.innerText || '';

    if (textContent.length < 3) {
      return html;
    }

    console.log(`Translating HTML (first 100 chars): ${textContent.substring(0, 100)}`);
    
    // Use dynamic import for ES module
    const translatte = (await import('translatte')).default;
    const result = await translatte(textContent, {
      from: 'en',
      to: targetLanguage,
    });
    
    const translatedText = result?.text || textContent;
    
    if (!translatedText) {
      return html;
    }
    
    console.log(`HTML translation successful: ${translatedText.substring(0, 100)}`);
    
    // Return HTML with translated text
    return `<p>${translatedText}</p>`;
  } catch (error) {
    console.error('HTML translation error:', error);
    return html;
  }
};
