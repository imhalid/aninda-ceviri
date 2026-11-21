const NATIVE_HOST_NAME = 'com.halit.apple_translator';

const DEFAULT_SETTINGS = {
  targetLang: 'tr',
  autoObserve: true,
  selectionPopup: true,
  translateTitle: true,
  theme: 'auto', // 'auto' | 'light' | 'dark'
  engine: 'auto' // 'auto' | 'apple' | 'google'
};

const MAX_CACHE_SIZE = 5000;
const translationCache = new Map();
const dictCache = new Map();

let nativePort = null;
let nativeReqSeq = 0;
const pendingNativeRequests = new Map();

function setCache(key, value) {
  if (translationCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = translationCache.keys().next().value;
    translationCache.delete(oldestKey);
  }
  translationCache.set(key, value);
}

async function getSettings() {
  const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
  return {
    targetLang: stored.targetLang || DEFAULT_SETTINGS.targetLang,
    autoObserve: typeof stored.autoObserve === 'boolean' ? stored.autoObserve : DEFAULT_SETTINGS.autoObserve,
    selectionPopup:
      typeof stored.selectionPopup === 'boolean' ? stored.selectionPopup : DEFAULT_SETTINGS.selectionPopup,
    translateTitle:
      typeof stored.translateTitle === 'boolean' ? stored.translateTitle : DEFAULT_SETTINGS.translateTitle,
    theme: stored.theme || DEFAULT_SETTINGS.theme,
    engine: stored.engine || DEFAULT_SETTINGS.engine
  };
}

function getNativePort() {
  if (nativePort) return nativePort;

  nativePort = chrome.runtime.connectNative(NATIVE_HOST_NAME);

  nativePort.onMessage.addListener((msg) => {
    if (!msg?.id) return;
    const pending = pendingNativeRequests.get(msg.id);
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingNativeRequests.delete(msg.id);
    pending.resolve(msg);
  });

  nativePort.onDisconnect.addListener(() => {
    const errMsg = chrome.runtime.lastError?.message || 'NATIVE_HOST_DISCONNECTED';
    nativePort = null;
    for (const [id, pending] of pendingNativeRequests.entries()) {
      clearTimeout(pending.timer);
      pendingNativeRequests.delete(id);
      pending.resolve({
        id,
        ok: false,
        fallback: true,
        reason: errMsg
      });
    }
  });

  return nativePort;
}

function callAppleNativeHost(payload, timeoutMs = 15000) {
  return new Promise((resolve) => {
    try {
      const port = getNativePort();
      const id = String(++nativeReqSeq);
      const timer = setTimeout(() => {
        pendingNativeRequests.delete(id);
        resolve({ id, ok: false, fallback: true, reason: 'NATIVE_TIMEOUT' });
      }, timeoutMs);

      pendingNativeRequests.set(id, { resolve, timer });
      port.postMessage({ ...payload, id });
    } catch (err) {
      resolve({
        ok: false,
        fallback: true,
        reason: err?.message || 'NATIVE_CONNECT_FAILED'
      });
    }
  });
}

async function fetchGoogleTranslate(text, targetLang, attempt = 0) {
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetch(url);
  if (response.status === 429 && attempt < 2) {
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    return fetchGoogleTranslate(text, targetLang, attempt + 1);
  }
  if (!response.ok) {
    throw new Error(`Çeviri servisi hatası (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error('Beklenmeyen çeviri yanıtı');
  }
  return data[0].map((part) => (Array.isArray(part) && part[0] ? part[0] : '')).join('');
}

async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let index = 0;

  async function next() {
    while (index < items.length) {
      const current = index++;
      results[current] = await worker(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, next);
  await Promise.all(workers);
  return results;
}

async function translateSingleGoogle(text, targetLang) {
  const cacheKey = `google:${targetLang}\0${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }
  const translated = await fetchGoogleTranslate(text, targetLang);
  setCache(cacheKey, translated);
  return translated;
}

async function translateBatchGoogle(texts, targetLang) {
  const results = new Array(texts.length);
  const uncachedMap = new Map();

  texts.forEach((text, idx) => {
    const key = `google:${targetLang}\0${text}`;
    if (translationCache.has(key)) {
      results[idx] = translationCache.get(key);
    } else {
      if (!uncachedMap.has(text)) {
        uncachedMap.set(text, []);
      }
      uncachedMap.get(text).push(idx);
    }
  });

  if (uncachedMap.size === 0) {
    return results;
  }

  const singleLineItems = [];
  const multiLineItems = [];

  for (const text of uncachedMap.keys()) {
    if (/[\r\n]/.test(text) || encodeURIComponent(text).length > 1200) {
      multiLineItems.push(text);
    } else {
      singleLineItems.push(text);
    }
  }

  const chunks = [];
  let currentChunk = [];
  let currentEncodedLen = 0;

  for (const item of singleLineItems) {
    const itemLen = encodeURIComponent(item).length + 3;
    if (currentChunk.length > 0 && (currentEncodedLen + itemLen > 1400 || currentChunk.length >= 25)) {
      chunks.push(currentChunk);
      currentChunk = [item];
      currentEncodedLen = itemLen;
    } else {
      currentChunk.push(item);
      currentEncodedLen += itemLen;
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  const translatedByText = new Map();

  await runWithConcurrency(chunks, 3, async (chunk) => {
    if (chunk.length === 1) {
      translatedByText.set(chunk[0], await translateSingleGoogle(chunk[0], targetLang));
      return;
    }

    const joined = chunk.join('\n');
    const translatedJoined = await fetchGoogleTranslate(joined, targetLang);
    const lines = translatedJoined.split('\n');

    if (lines.length === chunk.length) {
      chunk.forEach((orig, i) => {
        const val = lines[i];
        setCache(`google:${targetLang}\0${orig}`, val);
        translatedByText.set(orig, val);
      });
    } else {
      await runWithConcurrency(chunk, 4, async (orig) => {
        translatedByText.set(orig, await translateSingleGoogle(orig, targetLang));
      });
    }
  });

  if (multiLineItems.length > 0) {
    await runWithConcurrency(multiLineItems, 4, async (orig) => {
      translatedByText.set(orig, await translateSingleGoogle(orig, targetLang));
    });
  }

  for (const [text, indices] of uncachedMap.entries()) {
    const translated = translatedByText.get(text) ?? text;
    for (const idx of indices) {
      results[idx] = translated;
    }
  }

  return results;
}

function formatAppleError(res) {
  const reason = res?.reason || '';
  if (reason === 'NOT_INSTALLED') {
    const pair = res.sourceLang && res.targetLang ? ` (${res.sourceLang} → ${res.targetLang})` : '';
    return `Bu dil paketi${pair} Mac'inizde kurulu değil. Sistem Ayarları → Dil ve Bölge → Çeviri Dilleri'nden indirin veya motoru 'Akıllı' yapın.`;
  }
  if (reason === 'UNSUPPORTED') {
    return `Apple yerel çeviri bu dil çiftini desteklemiyor. Motoru 'Akıllı' veya 'Google' yapın.`;
  }
  return `Apple yerel çeviri başlatılamadı (${reason || 'bağlantı hatası'}).`;
}

async function translateBatchApple(texts, targetLang, pageLang) {
  const results = new Array(texts.length);
  const uncachedTexts = [];
  const uncachedIndicesByText = new Map();

  texts.forEach((text, idx) => {
    const key = `apple:${targetLang}\0${text}`;
    if (translationCache.has(key)) {
      results[idx] = translationCache.get(key);
    } else {
      if (!uncachedIndicesByText.has(text)) {
        uncachedIndicesByText.set(text, []);
        uncachedTexts.push(text);
      }
      uncachedIndicesByText.get(text).push(idx);
    }
  });

  if (uncachedTexts.length === 0) {
    return { ok: true, translations: results };
  }

  const res = await callAppleNativeHost({
    action: 'translate',
    texts: uncachedTexts,
    targetLang,
    pageLang: pageLang || ''
  });

  if (!res?.ok || !Array.isArray(res.translations)) {
    return {
      ok: false,
      fallback: Boolean(res?.fallback),
      reason: res?.reason,
      sourceLang: res?.sourceLang,
      targetLang: res?.targetLang,
      errorMessage: formatAppleError(res)
    };
  }

  uncachedTexts.forEach((orig, i) => {
    const translated = res.translations[i] ?? orig;
    setCache(`apple:${targetLang}\0${orig}`, translated);
    const indices = uncachedIndicesByText.get(orig) || [];
    for (const idx of indices) {
      results[idx] = translated;
    }
  });

  return { ok: true, translations: results, detectedSource: res.detectedSource || null };
}

async function fetchGoogleDictionary(text, targetLang) {
  const trimmed = text.trim();
  const cacheKey = `${targetLang}\0${trimmed}`;
  if (dictCache.has(cacheKey)) {
    return dictCache.get(cacheKey);
  }

  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&dt=bd&dt=rm&q=${encodeURIComponent(trimmed)}`;

  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  if (!Array.isArray(data)) return null;

  const translated = Array.isArray(data[0])
    ? data[0].map((part) => (Array.isArray(part) && part[0] ? part[0] : '')).join('')
    : '';

  let phonetic = '';
  if (Array.isArray(data[0])) {
    for (const part of data[0]) {
      if (Array.isArray(part) && typeof part[3] === 'string' && part[3].trim()) {
        phonetic = part[3].trim();
        break;
      }
    }
  }

  const detectedSource = typeof data[2] === 'string' ? data[2] : null;
  const dict = [];
  if (Array.isArray(data[1])) {
    for (const entry of data[1]) {
      if (Array.isArray(entry) && typeof entry[0] === 'string' && Array.isArray(entry[1])) {
        dict.push({
          pos: entry[0],
          terms: entry[1].slice(0, 12)
        });
      }
    }
  }

  const result = { translated, phonetic, detectedSource, dict };
  if (dictCache.size >= 1000) {
    dictCache.delete(dictCache.keys().next().value);
  }
  dictCache.set(cacheKey, result);
  return result;
}

async function translateBatch(texts, targetLang, engine = 'auto', pageLang = '') {
  if (engine === 'google') {
    const translations = await translateBatchGoogle(texts, targetLang);
    return { translations, usedEngine: 'google' };
  }

  const appleRes = await translateBatchApple(texts, targetLang, pageLang);
  if (appleRes.ok) {
    return {
      translations: appleRes.translations,
      usedEngine: 'apple',
      detectedSource: appleRes.detectedSource || null
    };
  }

  if (engine === 'apple') {
    throw new Error(appleRes.errorMessage);
  }

  const translations = await translateBatchGoogle(texts, targetLang);
  return {
    translations,
    usedEngine: 'google',
    fallbackReason: appleRes.reason,
    fallbackPair:
      appleRes.sourceLang && appleRes.targetLang
        ? `${appleRes.sourceLang} → ${appleRes.targetLang}`
        : null
  };
}

async function translateSelectionRich(text, targetLang, engine = 'auto', pageLang = '') {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw new Error('Çevrilecek metin boş');
  }

  const isShortLookup = trimmed.length <= 64 && trimmed.split(/\s+/).length <= 4;

  if (engine === 'apple') {
    const batchRes = await translateBatch([trimmed], targetLang, 'apple', pageLang);
    return {
      translated: batchRes.translations[0],
      usedEngine: 'apple',
      detectedSource: batchRes.detectedSource || null,
      phonetic: '',
      dict: []
    };
  }

  const batchPromise = translateBatch([trimmed], targetLang, engine, pageLang);
  const dictPromise = isShortLookup
    ? fetchGoogleDictionary(trimmed, targetLang).catch(() => null)
    : Promise.resolve(null);

  const [batchRes, dictRes] = await Promise.all([batchPromise, dictPromise]);

  return {
    translated: batchRes.translations[0] || dictRes?.translated || trimmed,
    usedEngine: batchRes.usedEngine,
    detectedSource: batchRes.detectedSource || dictRes?.detectedSource || null,
    phonetic: dictRes?.phonetic || '',
    dict: dictRes?.dict || [],
    fallbackReason: batchRes.fallbackReason || null,
    fallbackPair: batchRes.fallbackPair || null
  };
}

async function ensureContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js']
  });
}

async function setTabBadge(tabId, state) {
  if (!tabId) return;
  if (state === 'translating') {
    await chrome.action.setBadgeText({ tabId, text: '...' });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#3a3a3f' });
  } else if (state === 'translated') {
    await chrome.action.setBadgeText({ tabId, text: '✓' });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#28a745' });
  } else {
    await chrome.action.setBadgeText({ tabId, text: '' });
  }
}

async function toggleTranslateTab(tabId) {
  const settings = await getSettings();
  await ensureContentScript(tabId);
  return chrome.tabs.sendMessage(tabId, {
    type: 'TOGGLE_TRANSLATE',
    targetLang: settings.targetLang,
    autoObserve: settings.autoObserve,
    translateTitle: settings.translateTitle,
    engine: settings.engine
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'toggle-page-translate',
      title: 'Bu Sayfayı Çevir / Orijinale Dön',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'translate-selection',
      title: 'Seçili Metni / Kelimeyi Çevir',
      contexts: ['selection']
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  try {
    if (info.menuItemId === 'toggle-page-translate') {
      await toggleTranslateTab(tab.id);
    } else if (info.menuItemId === 'translate-selection' && info.selectionText) {
      const settings = await getSettings();
      await ensureContentScript(tab.id);
      const rich = await translateSelectionRich(
        info.selectionText,
        settings.targetLang,
        settings.engine
      );
      await chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_SELECTION_TRANSLATION',
        original: info.selectionText,
        targetLang: settings.targetLang,
        ...rich
      });
    }
  } catch (err) {
    console.warn('Context menu translate error:', err);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-translate') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    await toggleTranslateTab(tab.id);
  } catch (err) {
    console.warn('Command translate error:', err);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'TRANSLATE_BATCH') {
    translateBatch(
      message.texts || [],
      message.targetLang || 'tr',
      message.engine || 'auto',
      message.pageLang || ''
    )
      .then((res) => sendResponse({ ok: true, ...res }))
      .catch((error) => sendResponse({ ok: false, error: error.message || 'Çeviri başarısız' }));
    return true;
  }

  if (message?.type === 'TRANSLATE_SELECTION') {
    translateSelectionRich(
      message.text || '',
      message.targetLang || 'tr',
      message.engine || 'auto',
      message.pageLang || ''
    )
      .then((res) => sendResponse({ ok: true, ...res }))
      .catch((error) => sendResponse({ ok: false, error: error.message || 'Çeviri başarısız' }));
    return true;
  }

  if (message?.type === 'CHECK_APPLE_HOST') {
    callAppleNativeHost({ action: 'ping' }, 4000)
      .then((res) => sendResponse({ ok: Boolean(res?.ok), supportedLanguages: res?.supportedLanguages || [] }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === 'GET_APPLE_LANGUAGES') {
    callAppleNativeHost({ action: 'languageStatus', targetLang: message.targetLang || 'tr' }, 6000)
      .then((res) =>
        sendResponse({
          ok: Boolean(res?.ok),
          targetLang: res?.targetLang || message.targetLang || 'tr',
          languagePacks: res?.languagePacks || []
        })
      )
      .catch(() => sendResponse({ ok: false, languagePacks: [] }));
    return true;
  }

  if (message?.type === 'DOWNLOAD_APPLE_LANGUAGE') {
    callAppleNativeHost(
      {
        action: 'downloadLanguage',
        sourceLang: message.sourceLang || 'en',
        targetLang: message.targetLang || 'tr'
      },
      6000
    )
      .then((res) => sendResponse({ ok: Boolean(res?.ok), error: res?.error || null }))
      .catch((err) => sendResponse({ ok: false, error: err?.message || 'İndirme başlatılamadı' }));
    return true;
  }

  if (message?.type === 'OPEN_APPLE_SETTINGS') {
    callAppleNativeHost({ action: 'openSystemSettings' }, 4000)
      .then((res) => sendResponse({ ok: Boolean(res?.ok) }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === 'SET_BADGE') {
    const tabId = message.tabId ?? sender.tab?.id;
    setTabBadge(tabId, message.state)
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  return false;
});
