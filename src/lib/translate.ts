const translationCache = new Map<string, string>();

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
