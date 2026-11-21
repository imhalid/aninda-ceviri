(() => {
  if (window.__instantTranslatorLoaded) return;
  window.__instantTranslatorLoaded = true;

  const SKIP_TAGS = new Set([
    'SCRIPT',
    'STYLE',
    'NOSCRIPT',
    'TEXTAREA',
    'INPUT',
    'SELECT',
    'OPTION',
    'CODE',
    'PRE',
    'KBD',
    'SAMP',
    'SVG',
    'MATH',
    'CANVAS',
    'VIDEO',
    'AUDIO',
    'IFRAME'
  ]);

  const state = {
    isTranslated: false,
    isTranslating: false,
    targetLang: 'tr',
    engine: 'auto',
    usedEngine: null,
    fallbackReason: null,
    fallbackPair: null,
    autoObserve: true,
    translatedNodes: new Map(),
    translatedAttrs: new Map(),
    originalTitle: null,
    observer: null,
    pendingRoots: new Set(),
    observeTimer: null,
    runId: 0,
    lastError: null
  };

  function isSkippedElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return true;
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.id === 'instant-translator-host' || el.id === 'instant-translator-selection-host') return true;
    if (el.isContentEditable) return true;
    if (el.classList?.contains('notranslate')) return true;
    if (el.getAttribute('translate') === 'no') return true;
    return false;
  }

  function shouldTranslateText(text) {
    const trimmed = text.trim();
    if (trimmed.length < 2) return false;
    // Must contain at least one Unicode letter
    if (!/\p{L}/u.test(trimmed)) return false;
    // Skip pure URLs or emails
    if (/^(https?:\/\/|www\.|mailto:)\S+$/i.test(trimmed)) return false;
    return true;
  }

  function isNearViewport(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    return rect.top < window.innerHeight * 1.5 && rect.bottom > -250;
  }

  function collectEntries(root) {
    const near = [];
    const far = [];
    const attrEntries = [];

    if (!root) return { near, far, attrEntries };

    // Collect placeholder attributes on inputs/textareas inside root
    if (root.nodeType === Node.ELEMENT_NODE || root === document.body) {
      const rootEl = root === document.body ? document.body : root;
      const inputs = rootEl.querySelectorAll?.('input[placeholder], textarea[placeholder]') || [];
      for (const el of inputs) {
        if (
          el.closest?.(
            '.notranslate, [translate="no"], #instant-translator-host, #instant-translator-selection-host'
          )
        ) {
          continue;
        }
        const placeholder = el.getAttribute('placeholder');
        if (placeholder && shouldTranslateText(placeholder)) {
          const saved = state.translatedAttrs.get(el);
          if (!saved || !saved.has('placeholder')) {
            attrEntries.push({ el, attr: 'placeholder', original: placeholder });
          }
        }
      }
    }

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (state.translatedNodes.has(node)) return NodeFilter.FILTER_REJECT;
          let parent = node.parentElement;
          while (parent && parent !== document.documentElement) {
            if (isSkippedElement(parent)) return NodeFilter.FILTER_REJECT;
            parent = parent.parentElement;
          }
          if (!shouldTranslateText(node.nodeValue || '')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let textNode;
    while ((textNode = walker.nextNode())) {
      const parent = textNode.parentElement;
      const entry = { node: textNode, original: textNode.nodeValue };
      if (isNearViewport(parent)) {
        near.push(entry);
      } else {
        far.push(entry);
      }
    }

    return { near, far, attrEntries };
  }

  function applyTranslation(original, translated) {
    const match = original.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!match) return translated;
    return `${match[1]}${translated}${match[3]}`;
  }

  function extractCore(original) {
    const match = original.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return match ? match[2] : original.trim();
  }

  function notifyPopup(payload) {
    try {
      chrome.runtime.sendMessage(payload).catch(() => {});
    } catch {
      // Popup closed; ignore
    }
  }

  function setBadge(badgeState) {
    try {
      chrome.runtime.sendMessage({ type: 'SET_BADGE', state: badgeState }).catch(() => {});
    } catch {
      // Ignore
    }
  }

  const POS_LABELS = {
    tr: {
      noun: 'İsim',
      verb: 'Fiil',
      adjective: 'Sıfat',
      adverb: 'Zarf',
      pronoun: 'Zamir',
      preposition: 'Edat',
      conjunction: 'Bağlaç',
      interjection: 'Ünlem',
      exclamation: 'Ünlem',
      abbreviation: 'Kısaltma',
      article: 'Tanımlık',
      determiner: 'Belirteç',
      particle: 'İlgeç'
    },
    en: {
      noun: 'Noun',
      verb: 'Verb',
      adjective: 'Adjective',
      adverb: 'Adverb',
      pronoun: 'Pronoun',
      preposition: 'Preposition',
      conjunction: 'Conjunction',
      interjection: 'Interjection',
      exclamation: 'Exclamation',
      abbreviation: 'Abbreviation',
      article: 'Article',
      determiner: 'Determiner',
      particle: 'Particle'
    }
  };

  const CARD_LANGS = [
    ['tr', 'TR', { tr: 'Türkçe', en: 'Turkish' }],
    ['en', 'EN', { tr: 'İngilizce', en: 'English' }],
    ['de', 'DE', { tr: 'Almanca', en: 'German' }],
    ['fr', 'FR', { tr: 'Fransızca', en: 'French' }],
    ['es', 'ES', { tr: 'İspanyolca', en: 'Spanish' }],
    ['it', 'IT', { tr: 'İtalyanca', en: 'Italian' }],
    ['pt', 'PT', { tr: 'Portekizce', en: 'Portuguese' }],
    ['ru', 'RU', { tr: 'Rusça', en: 'Russian' }],
    ['ar', 'AR', { tr: 'Arapça', en: 'Arabic' }],
    ['ja', 'JA', { tr: 'Japonca', en: 'Japanese' }],
    ['ko', 'KO', { tr: 'Korece', en: 'Korean' }],
    ['zh-CN', 'ZH', { tr: 'Çince', en: 'Chinese' }]
  ];

  const CONTENT_I18N = {
    tr: {
      translate: 'Çevir',
      translating: 'Çevriliyor',
      autoSrc: 'OTO',
      close: 'Kapat (Esc)',
      listen: 'Dinle',
      listenTrg: 'Çeviriyi Dinle',
      copy: 'Kopyala',
      clickToCopy: 'Kopyalamak için tıklayın',
      error: 'Hata',
      translateFail: 'Çeviri yapılamadı.',
      connError: 'Bağlantı hatası',
      revertedToast: 'Orijinal sayfaya dönüldü',
      appleLabel: 'Apple Yerel',
      googleLabel: 'Google',
      translatedToast: (engine, count) => `Sayfa çevrildi (${engine} • ${count} metin) ✓`,
      errorToast: (msg) => `Hata: ${msg}`
    },
    en: {
      translate: 'Translate',
      translating: 'Translating',
      autoSrc: 'AUTO',
      close: 'Close (Esc)',
      listen: 'Listen',
      listenTrg: 'Listen to translation',
      copy: 'Copy',
      clickToCopy: 'Click to copy',
      error: 'Error',
      translateFail: 'Translation failed.',
      connError: 'Connection error',
      revertedToast: 'Reverted to original page',
      appleLabel: 'Apple Local',
      googleLabel: 'Google',
      translatedToast: (engine, count) => `Page translated (${engine} • ${count} items) ✓`,
      errorToast: (msg) => `Error: ${msg}`
    }
  };

  const SPEECH_LOCALE = {
    tr: 'tr-TR',
    en: 'en-US',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
    it: 'it-IT',
    pt: 'pt-PT',
    ru: 'ru-RU',
    ar: 'ar-SA',
    ja: 'ja-JP',
    ko: 'ko-KR',
    zh: 'zh-CN',
    'zh-CN': 'zh-CN'
  };

  const ICON_TRANSLATE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>`;
  const ICON_SPEAK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;
  const ICON_COPY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
  const ICON_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
  const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
  const ICON_CHEVRONS = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6.2 8 3.5l3 2.7"/><path d="M5 9.8 8 12.5l3-2.7"/></svg>`;

  const selectionPrefs = {
    enabled: true,
    targetLang: 'tr',
    engine: 'auto',
    theme: 'auto',
    uiLang: 'auto',
    translateTitle: true
  };

  let activeSelectionMode = null; // 'trigger' | 'card' | null
  let activeThemeTarget = null; // callback to live-update open card/pill theme

  function resolveUiLang() {
    if (selectionPrefs.uiLang === 'tr' || selectionPrefs.uiLang === 'en') {
      return selectionPrefs.uiLang;
    }
    return (navigator.language || 'en').toLowerCase().startsWith('tr') ? 'tr' : 'en';
  }

  function ct(key) {
    const lang = resolveUiLang();
    return CONTENT_I18N[lang]?.[key] ?? CONTENT_I18N.en[key] ?? key;
  }

  function resolveIsDark() {
    if (selectionPrefs.theme === 'dark') return true;
    if (selectionPrefs.theme === 'light') return false;
    return Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  }

  try {
    chrome.storage.local.get(
      {
        selectionPopup: true,
        targetLang: 'tr',
        engine: 'auto',
        theme: 'auto',
        uiLang: 'auto',
        translateTitle: true
      },
      (stored) => {
        selectionPrefs.enabled = typeof stored.selectionPopup === 'boolean' ? stored.selectionPopup : true;
        selectionPrefs.targetLang = stored.targetLang || 'tr';
        selectionPrefs.engine = stored.engine || 'auto';
        selectionPrefs.theme = stored.theme || 'auto';
        selectionPrefs.uiLang = stored.uiLang || 'auto';
        selectionPrefs.translateTitle =
          typeof stored.translateTitle === 'boolean' ? stored.translateTitle : true;
        activeThemeTarget?.();
      }
    );
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes.selectionPopup) {
        selectionPrefs.enabled = Boolean(changes.selectionPopup.newValue);
        if (!selectionPrefs.enabled) dismissSelectionUI();
      }
      if (changes.targetLang) {
        selectionPrefs.targetLang = changes.targetLang.newValue || 'tr';
      }
      if (changes.engine) {
        selectionPrefs.engine = changes.engine.newValue || 'auto';
      }
      if (changes.theme) {
        selectionPrefs.theme = changes.theme.newValue || 'auto';
        activeThemeTarget?.();
      }
      if (changes.uiLang) {
        selectionPrefs.uiLang = changes.uiLang.newValue || 'auto';
      }
      if (changes.translateTitle) {
        selectionPrefs.translateTitle = Boolean(changes.translateTitle.newValue);
      }
    });
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (selectionPrefs.theme === 'auto') activeThemeTarget?.();
    });
  } catch {
    // Ignore storage sync errors
  }

  function showToast(text, duration = 2200) {
    const existing = document.getElementById('instant-translator-host');
    if (existing) existing.remove();

    const host = document.createElement('div');
    host.id = 'instant-translator-host';
    host.setAttribute('translate', 'no');
    host.className = 'notranslate';
    const shadow = host.attachShadow({ mode: 'closed' });

    const isDark = resolveIsDark();
    const wrapper = document.createElement('div');
    wrapper.style.cssText = [
      'position: fixed',
      'right: 18px',
      'bottom: 18px',
      'z-index: 2147483647',
      'max-width: 320px',
      'font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
      'font-size: 12.5px',
      'font-weight: 500',
      'letter-spacing: -0.01em',
      'line-height: 1.4',
      isDark ? 'color: #f5f5f7' : 'color: #1d1d1f',
      isDark ? 'background: rgba(34, 34, 37, 0.94)' : 'background: rgba(255, 255, 255, 0.94)',
      'backdrop-filter: blur(20px) saturate(180%)',
      '-webkit-backdrop-filter: blur(20px) saturate(180%)',
      isDark ? 'border: 0.5px solid rgba(255, 255, 255, 0.14)' : 'border: 0.5px solid rgba(0, 0, 0, 0.1)',
      'border-radius: 12px',
      'box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18)',
      'padding: 8px 13px',
      'transition: opacity 0.2s ease, transform 0.2s ease'
    ].join(';');
    wrapper.textContent = text;

    shadow.appendChild(wrapper);
    (document.body || document.documentElement).appendChild(host);

    if (duration > 0) {
      setTimeout(() => {
        if (host.isConnected) {
          wrapper.style.opacity = '0';
          wrapper.style.transform = 'translateY(4px)';
          setTimeout(() => host.remove(), 220);
        }
      }, duration);
    }
  }

  function dismissSelectionUI() {
    activeSelectionMode = null;
    activeThemeTarget = null;
    const existing = document.getElementById('instant-translator-selection-host');
    if (existing) existing.remove();
  }

  function getSelectionRect(fallbackPoint = null) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const clientRects = Array.from(range.getClientRects()).filter(
        (r) => r.width > 0.5 || r.height > 0.5
      );
      if (clientRects.length > 0) {
        return clientRects[clientRects.length - 1];
      }
      const rect = range.getBoundingClientRect();
      if (rect && (rect.width > 0 || rect.height > 0)) return rect;
    }
    if (fallbackPoint) {
      return {
        left: fallbackPoint.x,
        right: fallbackPoint.x,
        top: fallbackPoint.y - 16,
        bottom: fallbackPoint.y + 4,
        width: 0,
        height: 20
      };
    }
    return null;
  }

  function speakText(text, langCode, btnEl = null) {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        const utter = new SpeechSynthesisUtterance(text);
        if (langCode) {
          const clean = langCode.toLowerCase();
          utter.lang = SPEECH_LOCALE[clean] || SPEECH_LOCALE[clean.split('-')[0]] || langCode;
        }
        utter.rate = 0.96;
        if (btnEl) {
          btnEl.classList.add('speaking');
          const clear = () => btnEl.classList.remove('speaking');
          utter.onend = clear;
          utter.onerror = clear;
        }
        window.speechSynthesis.speak(utter);
      }, 20);
    } catch {
      // Ignore speech errors
    }
  }

  function clampPosition(left, top, width, height) {
    const pad = 12;
    const maxLeft = Math.max(pad, window.innerWidth - width - pad);
    const maxTop = Math.max(pad, window.innerHeight - height - pad);
    return {
      left: Math.min(Math.max(pad, left), maxLeft),
      top: Math.min(Math.max(pad, top), maxTop)
    };
  }

  function showSelectionTrigger(text, rect, pointer = null) {
    dismissSelectionUI();
    if (!rect) return;

    activeSelectionMode = 'trigger';
    const host = document.createElement('div');
    host.id = 'instant-translator-selection-host';
    host.setAttribute('translate', 'no');
    host.className = 'notranslate';
    const shadow = host.attachShadow({ mode: 'closed' });

    const anchorX = pointer ? pointer.x - 16 : rect.right - 20;
    const anchorY = rect.bottom + 8;
    const pos = clampPosition(anchorX, anchorY, 86, 30);

    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      @keyframes pillIn {
        from { opacity: 0; transform: translateY(4px) scale(0.92); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .pill {
        position: fixed;
        left: ${pos.left}px;
        top: ${pos.top}px;
        z-index: 2147483647;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 29px;
        padding: 0 11px 0 9px;
        border: 0.5px solid rgba(0, 0, 0, 0.1);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.94);
        backdrop-filter: blur(18px) saturate(180%);
        -webkit-backdrop-filter: blur(18px) saturate(180%);
        color: #1d1d1f;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: -0.01em;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.13), 0 1px 3px rgba(0, 0, 0, 0.06);
        cursor: pointer;
        user-select: none;
        animation: pillIn 0.16s cubic-bezier(0.32, 0.72, 0, 1);
        transition: transform 0.12s ease, box-shadow 0.12s ease;
      }
      .pill:hover {
        background: #ffffff;
        transform: translateY(-1px);
        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0, 0, 0, 0.07);
      }
      .pill:active { transform: scale(0.95); }
      .pill.dark {
        background: rgba(34, 34, 37, 0.95);
        border-color: rgba(255, 255, 255, 0.14);
        color: #f5f5f7;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.48);
      }
      .pill.dark:hover { background: rgba(44, 44, 48, 0.98); }
      svg { width: 13.5px; height: 13.5px; flex-shrink: 0; }
    `;

    const btn = document.createElement('button');
    btn.className = 'pill' + (resolveIsDark() ? ' dark' : '');
    btn.type = 'button';
    btn.innerHTML = `${ICON_TRANSLATE}<span>${ct('translate')}</span>`;

    activeThemeTarget = () => {
      btn.classList.toggle('dark', resolveIsDark());
    };

    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSelectionCard(text, rect);
    });

    shadow.append(style, btn);
    (document.body || document.documentElement).appendChild(host);
  }

  async function openSelectionCard(text, rect, preloaded = null) {
    dismissSelectionUI();
    const trimmed = (text || '').trim();
    if (!trimmed) return;

    activeSelectionMode = 'card';
    const host = document.createElement('div');
    host.id = 'instant-translator-selection-host';
    host.setAttribute('translate', 'no');
    host.className = 'notranslate';
    const shadow = host.attachShadow({ mode: 'closed' });

    const cardWidth = 344;
    const anchorRect = rect || {
      left: window.innerWidth / 2 - cardWidth / 2,
      right: window.innerWidth / 2 + cardWidth / 2,
      bottom: 84,
      top: 84
    };

    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      * { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes menuIn {
        from { opacity: 0; transform: translateY(-4px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes pulseSpeak {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.45; }
      }
      .card {
        --canvas: #f5f5f7;
        --surface: #ffffff;
        --surface-elevated: rgba(255, 255, 255, 0.96);
        --track: #e8e8ed;
        --hover: rgba(0, 0, 0, 0.045);
        --hairline: rgba(0, 0, 0, 0.08);
        --border: rgba(0, 0, 0, 0.08);
        --ink: #1d1d1f;
        --ink-secondary: #6e6e73;
        --ink-tertiary: #86868b;
        --green: #28a745;
        --green-soft: rgba(40, 167, 69, 0.12);
        --red: #d70015;
        --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.04), 0 0 0 0.5px rgba(0, 0, 0, 0.06);
        --shadow-popover: 0 22px 54px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.06), 0 0 0 0.5px rgba(0, 0, 0, 0.1);
        --shadow-menu: 0 14px 36px rgba(0, 0, 0, 0.16), 0 0 0 0.5px rgba(0, 0, 0, 0.08);
        position: fixed;
        left: 0;
        top: 0;
        z-index: 2147483647;
        width: ${cardWidth}px;
        max-width: calc(100vw - 24px);
        max-height: 440px;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
        font-size: 13px;
        line-height: 1.42;
        letter-spacing: -0.008em;
        color: var(--ink);
        background: var(--canvas);
        border-radius: 14px;
        box-shadow: var(--shadow-popover);
        overflow: visible;
        opacity: 0;
        transform: translateY(5px) scale(0.98);
        transition: opacity 0.18s cubic-bezier(0.32, 0.72, 0, 1), transform 0.18s cubic-bezier(0.32, 0.72, 0, 1);
      }
      .card.dark {
        --canvas: #161618;
        --surface: #222225;
        --surface-elevated: rgba(38, 38, 42, 0.97);
        --track: #2c2c30;
        --hover: rgba(255, 255, 255, 0.065);
        --hairline: rgba(255, 255, 255, 0.09);
        --border: rgba(255, 255, 255, 0.09);
        --ink: #f5f5f7;
        --ink-secondary: #a1a1a6;
        --ink-tertiary: #8e8e93;
        --green: #30d158;
        --green-soft: rgba(48, 209, 88, 0.16);
        --red: #ff453a;
        --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.28), 0 0 0 0.5px rgba(255, 255, 255, 0.07);
        --shadow-popover: 0 24px 60px rgba(0, 0, 0, 0.62), 0 0 0 0.5px rgba(255, 255, 255, 0.13);
        --shadow-menu: 0 16px 40px rgba(0, 0, 0, 0.55), 0 0 0 0.5px rgba(255, 255, 255, 0.12);
      }
      .card.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 12px 6px;
        cursor: grab;
        user-select: none;
      }
      .topbar:active { cursor: grabbing; }
      .route {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }
      .code-pill {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.03em;
        padding: 2.5px 6px;
        border-radius: 5px;
        background: var(--track);
        color: var(--ink);
        flex-shrink: 0;
      }
      .code-pill.muted { color: var(--ink-secondary); }
      .arrow { color: var(--ink-tertiary); font-size: 11.5px; }
      .custom-select { position: relative; }
      .select-trigger {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 7px 4px 5px;
        border-radius: 8px;
        border: 0.5px solid var(--border);
        background: var(--surface);
        color: var(--ink);
        font-family: inherit;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: transform 0.08s ease;
      }
      .select-trigger:hover { background: var(--hover); }
      .select-trigger:active { transform: scale(0.98); }
      .select-trigger-left { display: flex; align-items: center; gap: 6px; }
      .select-menu {
        position: absolute;
        left: 0;
        top: calc(100% + 5px);
        z-index: 30;
        width: 190px;
        max-height: 196px;
        overflow-y: auto;
        padding: 4px;
        border-radius: 11px;
        background: var(--surface-elevated);
        backdrop-filter: blur(22px);
        -webkit-backdrop-filter: blur(22px);
        box-shadow: var(--shadow-menu);
        animation: menuIn 0.14s cubic-bezier(0.32, 0.72, 0, 1);
      }
      .select-menu.hidden { display: none; }
      .select-opt {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border: none;
        background: transparent;
        color: var(--ink);
        font-family: inherit;
        font-size: 12px;
        font-weight: 500;
        padding: 5.5px 8px;
        border-radius: 7px;
        cursor: pointer;
        text-align: left;
      }
      .select-opt:hover { background: var(--hover); }
      .select-opt-left { display: flex; align-items: center; gap: 7px; }
      .opt-check { opacity: 0; width: 12px; height: 12px; }
      .select-opt.selected .opt-check { opacity: 1; }
      .topbar-right {
        display: flex;
        align-items: center;
        gap: 5px;
        flex-shrink: 0;
      }
      .engine-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 10.5px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 999px;
        background: var(--track);
        color: var(--ink-secondary);
      }
      .engine-pill.apple {
        background: var(--green-soft);
        color: var(--green);
      }
      .engine-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: currentColor;
      }
      .icon-btn {
        width: 24px;
        height: 24px;
        border: none;
        border-radius: 7px;
        background: transparent;
        color: var(--ink-tertiary);
        display: grid;
        place-items: center;
        cursor: pointer;
        transition: transform 0.08s ease;
      }
      .icon-btn:hover { background: var(--hover); color: var(--ink); }
      .icon-btn:active { transform: scale(0.92); }
      .icon-btn.active, .icon-btn.speaking { color: var(--green); }
      .icon-btn.speaking svg { animation: pulseSpeak 0.9s infinite; }
      .body {
        padding: 4px 12px 12px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 9px;
      }
      .group-card {
        background: var(--surface);
        border-radius: 12px;
        box-shadow: var(--shadow-card);
      }
      .group-row {
        padding: 10px 12px;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
      }
      .group-main {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .hairline {
        height: 1px;
        margin-left: 12px;
        background: var(--hairline);
      }
      .src-text {
        font-size: 12.5px;
        color: var(--ink-secondary);
        max-height: 70px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .phonetic {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11px;
        color: var(--ink-tertiary);
      }
      .trg-text {
        font-size: 14.5px;
        font-weight: 600;
        letter-spacing: -0.014em;
        line-height: 1.42;
        max-height: 140px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .row-actions {
        display: flex;
        align-items: center;
        gap: 1px;
        flex-shrink: 0;
        margin-top: -2px;
      }
      .skeleton {
        height: 18px;
        width: 78%;
        border-radius: 6px;
        background: linear-gradient(90deg, rgba(142,142,147,0.14) 25%, rgba(142,142,147,0.28) 50%, rgba(142,142,147,0.14) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.2s infinite;
      }
      .dict-card {
        background: var(--surface);
        border-radius: 12px;
        box-shadow: var(--shadow-card);
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 9px;
      }
      .dict-card.hidden { display: none; }
      .dict-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .pos-label {
        font-size: 10.5px;
        font-weight: 600;
        color: var(--ink-tertiary);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
      .chip {
        border: 0.5px solid var(--border);
        background: var(--canvas);
        color: var(--ink);
        font-family: inherit;
        border-radius: 999px;
        padding: 2.5px 9px;
        font-size: 11.5px;
        cursor: pointer;
        transition: transform 0.08s ease;
      }
      .chip:hover { background: var(--hover); }
      .chip:active { transform: scale(0.95); }
      .chip.copied {
        border-color: var(--green);
        color: var(--green);
      }
      .err-text {
        color: var(--red);
        font-size: 12.5px;
        font-weight: 500;
      }
      svg { width: 13.5px; height: 13.5px; display: block; }
    `;

    let currentTargetLang = preloaded?.targetLang || selectionPrefs.targetLang || 'tr';
    let currentDetectedSource = preloaded?.detectedSource || '';
    let currentTranslation = preloaded?.translated || '';

    const card = document.createElement('div');
    card.className = 'card' + (resolveIsDark() ? ' dark' : '');
    activeThemeTarget = () => {
      card.classList.toggle('dark', resolveIsDark());
    };

    const topbar = document.createElement('div');
    topbar.className = 'topbar';

    const route = document.createElement('div');
    route.className = 'route';

    const srcBadge = document.createElement('span');
    srcBadge.className = 'code-pill muted';
    srcBadge.textContent = currentDetectedSource ? currentDetectedSource.toUpperCase() : ct('autoSrc');

    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = '→';

    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';
    const selectTrigger = document.createElement('button');
    selectTrigger.type = 'button';
    selectTrigger.className = 'select-trigger';
    const selectMenu = document.createElement('div');
    selectMenu.className = 'select-menu hidden';

    function renderCardSelect() {
      const ui = resolveUiLang();
      const active = CARD_LANGS.find(([c]) => c === currentTargetLang) || CARD_LANGS[0];
      const activeLabel = active[2][ui] || active[2].en;
      selectTrigger.innerHTML = `
        <span class="select-trigger-left">
          <span class="code-pill">${active[1]}</span>
          <span>${activeLabel}</span>
        </span>
        ${ICON_CHEVRONS}
      `;
      selectMenu.innerHTML = '';
      for (const [code, shortCode, labels] of CARD_LANGS) {
        const label = labels[ui] || labels.en;
        const opt = document.createElement('button');
        opt.type = 'button';
        opt.className = 'select-opt' + (code === currentTargetLang ? ' selected' : '');
        opt.innerHTML = `
          <span class="select-opt-left">
            <span class="code-pill">${shortCode}</span>
            <span>${label}</span>
          </span>
          <span class="opt-check">${ICON_CHECK}</span>
        `;
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          currentTargetLang = code;
          selectMenu.classList.add('hidden');
          renderCardSelect();
          runLookup(currentTargetLang);
        });
        selectMenu.appendChild(opt);
      }
    }

    selectTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      selectMenu.classList.toggle('hidden');
    });

    card.addEventListener('click', (e) => {
      if (!customSelect.contains(e.target)) {
        selectMenu.classList.add('hidden');
      }
    });

    renderCardSelect();
    customSelect.append(selectTrigger, selectMenu);
    route.append(srcBadge, arrow, customSelect);

    const topbarRight = document.createElement('div');
    topbarRight.className = 'topbar-right';
    topbarRight.innerHTML = `
      <span class="engine-pill" id="enginePill">${ct('translating')}</span>
      <button class="icon-btn" id="closeBtn" type="button" title="${ct('close')}">${ICON_CLOSE}</button>
    `;

    topbar.append(route, topbarRight);

    let dragInfo = null;
    topbar.addEventListener('mousedown', (e) => {
      if (e.target.closest('button') || e.target.closest('.custom-select')) return;
      const cardRect = card.getBoundingClientRect();
      dragInfo = {
        offsetX: e.clientX - cardRect.left,
        offsetY: e.clientY - cardRect.top,
        w: cardRect.width,
        h: cardRect.height
      };
      const onMove = (ev) => {
        if (!dragInfo) return;
        const next = clampPosition(
          ev.clientX - dragInfo.offsetX,
          ev.clientY - dragInfo.offsetY,
          dragInfo.w,
          dragInfo.h
        );
        card.style.left = `${next.left}px`;
        card.style.top = `${next.top}px`;
      };
      const onUp = () => {
        dragInfo = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });

    const body = document.createElement('div');
    body.className = 'body';

    const mainGroup = document.createElement('div');
    mainGroup.className = 'group-card';
    mainGroup.innerHTML = `
      <div class="group-row">
        <div class="group-main">
          <div class="src-text" id="srcTextEl"></div>
          <div class="phonetic" id="phoneticEl" style="display:none"></div>
        </div>
        <div class="row-actions">
          <button class="icon-btn" id="speakSrcBtn" type="button" title="${ct('listen')}">${ICON_SPEAK}</button>
        </div>
      </div>
      <div class="hairline"></div>
      <div class="group-row">
        <div class="group-main">
          <div class="trg-text" id="trgTextEl"><div class="skeleton"></div></div>
        </div>
        <div class="row-actions">
          <button class="icon-btn" id="speakTrgBtn" type="button" title="${ct('listenTrg')}">${ICON_SPEAK}</button>
          <button class="icon-btn" id="copyBtn" type="button" title="${ct('copy')}">${ICON_COPY}</button>
        </div>
      </div>
    `;
    mainGroup.querySelector('#srcTextEl').textContent = trimmed;

    const dictCard = document.createElement('div');
    dictCard.className = 'dict-card hidden';

    body.append(mainGroup, dictCard);
    card.append(topbar, body);
    shadow.append(style, card);
    (document.body || document.documentElement).appendChild(host);

    function positionCard(initial = false) {
      if (!card.isConnected) return;
      const cr = card.getBoundingClientRect();
      if (initial) {
        const spaceBelow = window.innerHeight - anchorRect.bottom - 14;
        const spaceAbove = anchorRect.top - 14;
        const placeAbove = spaceBelow < cr.height && spaceAbove > spaceBelow;
        const targetTop = placeAbove ? anchorRect.top - cr.height - 10 : anchorRect.bottom + 10;
        const pos = clampPosition(anchorRect.left, targetTop, cr.width, cr.height);
        card.style.left = `${pos.left}px`;
        card.style.top = `${pos.top}px`;
        requestAnimationFrame(() => card.classList.add('visible'));
      } else {
        const pos = clampPosition(cr.left, cr.top, cr.width, cr.height);
        card.style.left = `${pos.left}px`;
        card.style.top = `${pos.top}px`;
      }
    }

    positionCard(true);

    const enginePill = topbarRight.querySelector('#enginePill');
    const closeBtn = topbarRight.querySelector('#closeBtn');
    const phoneticEl = mainGroup.querySelector('#phoneticEl');
    const speakSrcBtn = mainGroup.querySelector('#speakSrcBtn');
    const speakTrgBtn = mainGroup.querySelector('#speakTrgBtn');
    const copyBtn = mainGroup.querySelector('#copyBtn');
    const trgTextEl = mainGroup.querySelector('#trgTextEl');

    closeBtn.addEventListener('click', dismissSelectionUI);
    speakSrcBtn.addEventListener('click', () =>
      speakText(trimmed, currentDetectedSource, speakSrcBtn)
    );
    speakTrgBtn.addEventListener('click', () =>
      speakText(currentTranslation, currentTargetLang, speakTrgBtn)
    );
    copyBtn.addEventListener('click', async () => {
      if (!currentTranslation) return;
      try {
        await navigator.clipboard.writeText(currentTranslation);
        copyBtn.innerHTML = ICON_CHECK;
        copyBtn.classList.add('active');
        setTimeout(() => {
          if (copyBtn.isConnected) {
            copyBtn.innerHTML = ICON_COPY;
            copyBtn.classList.remove('active');
          }
        }, 1200);
      } catch {
        // Ignore
      }
    });

    function renderResult(res) {
      if (!res?.ok) {
        enginePill.textContent = ct('error');
        enginePill.className = 'engine-pill';
        trgTextEl.innerHTML = '';
        const err = document.createElement('div');
        err.className = 'err-text';
        err.textContent = res?.error || ct('translateFail');
        trgTextEl.appendChild(err);
        dictCard.innerHTML = '';
        dictCard.classList.add('hidden');
        positionCard(false);
        return;
      }

      currentTranslation = res.translated || '';
      currentDetectedSource = res.detectedSource || '';
      srcBadge.textContent = currentDetectedSource ? currentDetectedSource.toUpperCase() : ct('autoSrc');

      if (res.usedEngine === 'apple') {
        enginePill.innerHTML = '<span class="engine-dot"></span><span>Apple</span>';
        enginePill.className = 'engine-pill apple';
      } else {
        enginePill.textContent = 'Google';
        enginePill.className = 'engine-pill';
      }

      if (res.phonetic) {
        phoneticEl.textContent = `/${res.phonetic}/`;
        phoneticEl.style.display = 'block';
      } else {
        phoneticEl.style.display = 'none';
      }

      trgTextEl.textContent = currentTranslation;
      dictCard.innerHTML = '';

      if (Array.isArray(res.dict) && res.dict.length > 0) {
        const posMap = POS_LABELS[resolveUiLang()] || POS_LABELS.en;
        for (const group of res.dict) {
          const groupEl = document.createElement('div');
          groupEl.className = 'dict-group';
          const label = document.createElement('div');
          label.className = 'pos-label';
          label.textContent = posMap[group.pos.toLowerCase()] || group.pos;

          const chips = document.createElement('div');
          chips.className = 'chips';
          for (const term of group.terms || []) {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'chip';
            chip.textContent = term;
            chip.title = ct('clickToCopy');
            chip.addEventListener('click', async () => {
              try {
                await navigator.clipboard.writeText(term);
                chip.classList.add('copied');
                chip.textContent = `${term} ✓`;
                setTimeout(() => {
                  if (chip.isConnected) {
                    chip.classList.remove('copied');
                    chip.textContent = term;
                  }
                }, 1000);
              } catch {
                // Ignore
              }
            });
            chips.appendChild(chip);
          }
          groupEl.append(label, chips);
          dictCard.appendChild(groupEl);
        }
        dictCard.classList.remove('hidden');
      } else {
        dictCard.classList.add('hidden');
      }

      requestAnimationFrame(() => positionCard(false));
    }

    async function runLookup(targetLang) {
      trgTextEl.innerHTML = '<div class="skeleton"></div>';
      dictCard.innerHTML = '';
      dictCard.classList.add('hidden');
      enginePill.textContent = ct('translating');
      enginePill.className = 'engine-pill';
      try {
        const res = await chrome.runtime.sendMessage({
          type: 'TRANSLATE_SELECTION',
          text: trimmed,
          targetLang,
          engine: selectionPrefs.engine || 'auto',
          pageLang: document.documentElement?.lang || ''
        });
        if (host.isConnected) renderResult(res);
      } catch (err) {
        if (host.isConnected) {
          renderResult({ ok: false, error: err?.message || ct('connError') });
        }
      }
    }

    if (preloaded) {
      renderResult({ ok: true, ...preloaded });
    } else {
      runLookup(currentTargetLang);
    }
  }

  let selectionDebounce = null;
  document.addEventListener('mouseup', (e) => {
    if (!selectionPrefs.enabled || e.button !== 0) return;
    const host = document.getElementById('instant-translator-selection-host');
    if (host && (e.target === host || host.contains(e.target))) return;

    const active = document.activeElement;
    if (
      active &&
      (active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.tagName === 'SELECT' ||
        active.isContentEditable)
    ) {
      return;
    }

    const pointer = { x: e.clientX, y: e.clientY };
    clearTimeout(selectionDebounce);
    selectionDebounce = setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const text = sel.toString().trim();
      if (!text || text.length > 2000 || !/\p{L}/u.test(text)) {
        return;
      }
      const rect = getSelectionRect(pointer);
      if (rect) {
        showSelectionTrigger(text, rect, pointer);
      }
    }, 30);
  });

  document.addEventListener(
    'mousedown',
    (e) => {
      const host = document.getElementById('instant-translator-selection-host');
      if (host && (e.target === host || host.contains(e.target))) return;
      dismissSelectionUI();
    },
    true
  );

  window.addEventListener(
    'scroll',
    () => {
      if (activeSelectionMode === 'trigger') {
        dismissSelectionUI();
      }
    },
    { passive: true, capture: true }
  );

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dismissSelectionUI();
    }
  });

  async function translateEntries(entries, attrEntries, targetLang, engine, runId) {
    const batchSize = engine === 'google' ? 25 : 40;
    let completed = 0;
    const total = entries.length + attrEntries.length;
    const pageLang = document.documentElement?.lang || '';

    for (let i = 0; i < entries.length; i += batchSize) {
      if (state.runId !== runId) return;
      const slice = entries.slice(i, i + batchSize);
      const cores = slice.map((item) => extractCore(item.original));

      const res = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_BATCH',
        texts: cores,
        targetLang,
        engine,
        pageLang
      });

      if (state.runId !== runId) return;
      if (!res?.ok) {
        throw new Error(res?.error || 'Çeviri sırasında hata oluştu');
      }

      if (res.usedEngine) {
        state.usedEngine = res.usedEngine;
      }
      if (res.fallbackReason) {
        state.fallbackReason = res.fallbackReason;
        state.fallbackPair = res.fallbackPair || null;
      }

      slice.forEach((item, idx) => {
        if (!item.node.isConnected) return;
        if (!state.translatedNodes.has(item.node)) {
          state.translatedNodes.set(item.node, item.original);
        }
        const translatedCore = res.translations[idx] ?? cores[idx];
        item.node.nodeValue = applyTranslation(item.original, translatedCore);
      });

      completed += slice.length;
      notifyPopup({
        type: 'TRANSLATION_STATUS',
        isTranslated: state.isTranslated,
        isTranslating: state.isTranslating,
        translatedCount: state.translatedNodes.size,
        usedEngine: state.usedEngine,
        fallbackReason: state.fallbackReason,
        fallbackPair: state.fallbackPair,
        progress: total > 0 ? Math.round((completed / total) * 100) : 100
      });
    }

    if (attrEntries.length > 0 && state.runId === runId) {
      for (let i = 0; i < attrEntries.length; i += batchSize) {
        if (state.runId !== runId) return;
        const slice = attrEntries.slice(i, i + batchSize);
        const texts = slice.map((item) => item.original);
        const res = await chrome.runtime.sendMessage({
          type: 'TRANSLATE_BATCH',
          texts,
          targetLang,
          engine,
          pageLang
        });
        if (state.runId !== runId) return;
        if (res?.ok) {
          slice.forEach((item, idx) => {
            if (!item.el.isConnected) return;
            let map = state.translatedAttrs.get(item.el);
            if (!map) {
              map = new Map();
              state.translatedAttrs.set(item.el, map);
            }
            if (!map.has(item.attr)) {
              map.set(item.attr, item.original);
            }
            item.el.setAttribute(item.attr, res.translations[idx] ?? item.original);
          });
        }
      }
    }
  }

  function startObserver() {
    stopObserver();
    if (!state.autoObserve || !document.body) return;

    state.observer = new MutationObserver((mutations) => {
      if (!state.isTranslated) return;
      for (const m of mutations) {
        if (m.type === 'childList') {
          for (const added of m.addedNodes) {
            if (
              added.nodeType === Node.ELEMENT_NODE &&
              (added.id === 'instant-translator-host' ||
                added.id === 'instant-translator-selection-host')
            ) {
              continue;
            }
            if (added.nodeType === Node.ELEMENT_NODE || added.nodeType === Node.TEXT_NODE) {
              state.pendingRoots.add(added);
            }
          }
        }
      }

      if (state.pendingRoots.size > 0 && !state.observeTimer) {
        state.observeTimer = setTimeout(flushObservedNodes, 350);
      }
    });

    state.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function stopObserver() {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    if (state.observeTimer) {
      clearTimeout(state.observeTimer);
      state.observeTimer = null;
    }
    state.pendingRoots.clear();
  }

  async function flushObservedNodes() {
    state.observeTimer = null;
    if (!state.isTranslated || state.pendingRoots.size === 0) return;

    const roots = Array.from(state.pendingRoots);
    state.pendingRoots.clear();

    const near = [];
    const far = [];
    const attrEntries = [];
    const seenNodes = new Set();

    for (const root of roots) {
      if (!root.isConnected) continue;
      if (root.nodeType === Node.TEXT_NODE) {
        if (!state.translatedNodes.has(root) && !seenNodes.has(root)) {
          let parent = root.parentElement;
          let skip = false;
          while (parent && parent !== document.documentElement) {
            if (isSkippedElement(parent)) {
              skip = true;
              break;
            }
            parent = parent.parentElement;
          }
          if (!skip && shouldTranslateText(root.nodeValue || '')) {
            seenNodes.add(root);
            near.push({ node: root, original: root.nodeValue });
          }
        }
      } else if (root.nodeType === Node.ELEMENT_NODE && !isSkippedElement(root)) {
        const collected = collectEntries(root);
        for (const item of collected.near) {
          if (!seenNodes.has(item.node)) {
            seenNodes.add(item.node);
            near.push(item);
          }
        }
        for (const item of collected.far) {
          if (!seenNodes.has(item.node)) {
            seenNodes.add(item.node);
            far.push(item);
          }
        }
        attrEntries.push(...collected.attrEntries);
      }
    }

    const all = near.concat(far);
    if (all.length === 0 && attrEntries.length === 0) return;

    const runId = state.runId;
    try {
      await translateEntries(all, attrEntries, state.targetLang, state.engine, runId);
    } catch {
      // Silent fail for background dynamic updates
    }
  }

  function revertPage(showFeedback = false) {
    state.runId += 1;
    stopObserver();

    for (const [node, original] of state.translatedNodes.entries()) {
      try {
        node.nodeValue = original;
      } catch {
        // Ignore detached node errors
      }
    }
    state.translatedNodes.clear();

    for (const [el, attrMap] of state.translatedAttrs.entries()) {
      for (const [attr, original] of attrMap.entries()) {
        try {
          el.setAttribute(attr, original);
        } catch {
          // Ignore
        }
      }
    }
    state.translatedAttrs.clear();

    if (state.originalTitle !== null) {
      document.title = state.originalTitle;
      state.originalTitle = null;
    }

    state.isTranslated = false;
    state.isTranslating = false;
    state.usedEngine = null;
    state.fallbackReason = null;
    state.fallbackPair = null;
    state.lastError = null;
    setBadge('idle');
    notifyPopup({
      type: 'TRANSLATION_STATUS',
      isTranslated: false,
      isTranslating: false,
      translatedCount: 0,
      usedEngine: null,
      fallbackReason: null,
      fallbackPair: null,
      progress: 0
    });

    if (showFeedback) {
      showToast(ct('revertedToast'), 1800);
    }
  }

  async function translatePage(
    targetLang,
    autoObserve,
    engine,
    showFeedback = false,
    translateTitle = selectionPrefs.translateTitle
  ) {
    if (state.isTranslated) {
      revertPage(false);
    }

    const runId = ++state.runId;
    state.targetLang = targetLang || 'tr';
    state.engine = engine || 'auto';
    state.usedEngine = null;
    state.fallbackReason = null;
    state.fallbackPair = null;
    state.autoObserve = typeof autoObserve === 'boolean' ? autoObserve : state.autoObserve;
    state.isTranslating = true;
    state.lastError = null;
    setBadge('translating');

    notifyPopup({
      type: 'TRANSLATION_STATUS',
      isTranslated: false,
      isTranslating: true,
      translatedCount: 0,
      progress: 0
    });

    try {
      const root = document.body || document.documentElement;
      const { near, far, attrEntries } = collectEntries(root);
      const orderedEntries = near.concat(far);
      const pageLang = document.documentElement?.lang || '';

      if (translateTitle && document.title && shouldTranslateText(document.title)) {
        state.originalTitle = document.title;
        chrome.runtime
          .sendMessage({
            type: 'TRANSLATE_BATCH',
            texts: [document.title],
            targetLang: state.targetLang,
            engine: state.engine,
            pageLang
          })
          .then((res) => {
            if (state.runId === runId && res?.ok && res.translations?.[0]) {
              document.title = res.translations[0];
            }
          })
          .catch(() => {});
      }

      if (orderedEntries.length > 0 || attrEntries.length > 0) {
        await translateEntries(orderedEntries, attrEntries, state.targetLang, state.engine, runId);
      }

      if (state.runId !== runId) return;

      state.isTranslated = true;
      state.isTranslating = false;
      setBadge('translated');

      if (state.autoObserve) {
        startObserver();
      }

      notifyPopup({
        type: 'TRANSLATION_STATUS',
        isTranslated: true,
        isTranslating: false,
        translatedCount: state.translatedNodes.size,
        usedEngine: state.usedEngine,
        fallbackReason: state.fallbackReason,
        fallbackPair: state.fallbackPair,
        progress: 100
      });

      if (showFeedback) {
        const engineLabel = state.usedEngine === 'apple' ? ct('appleLabel') : ct('googleLabel');
        showToast(ct('translatedToast')(engineLabel, state.translatedNodes.size), 2400);
      }
    } catch (err) {
      if (state.runId !== runId) return;
      state.isTranslating = false;
      state.lastError = err?.message || ct('translateFail');
      setBadge(state.translatedNodes.size > 0 ? 'translated' : 'idle');
      notifyPopup({
        type: 'TRANSLATION_ERROR',
        error: state.lastError
      });
      if (showFeedback) {
        showToast(ct('errorToast')(state.lastError), 3200);
      }
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message?.type) return false;

    if (message.type === 'GET_STATUS') {
      sendResponse({
        ok: true,
        isTranslated: state.isTranslated,
        isTranslating: state.isTranslating,
        targetLang: state.targetLang,
        engine: state.engine,
        usedEngine: state.usedEngine,
        fallbackReason: state.fallbackReason,
        fallbackPair: state.fallbackPair,
        autoObserve: state.autoObserve,
        translatedCount: state.translatedNodes.size,
        lastError: state.lastError
      });
      return false;
    }

    if (message.type === 'TRANSLATE_PAGE') {
      translatePage(
        message.targetLang,
        message.autoObserve,
        message.engine,
        false,
        message.translateTitle
      );
      sendResponse({ ok: true, started: true });
      return false;
    }

    if (message.type === 'REVERT_PAGE') {
      revertPage(false);
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === 'TOGGLE_TRANSLATE') {
      if (state.isTranslated || state.isTranslating) {
        revertPage(true);
      } else {
        translatePage(
          message.targetLang,
          message.autoObserve,
          message.engine,
          true,
          message.translateTitle
        );
      }
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === 'SET_AUTO_OBSERVE') {
      state.autoObserve = Boolean(message.autoObserve);
      if (state.isTranslated) {
        if (state.autoObserve) {
          startObserver();
        } else {
          stopObserver();
        }
      }
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === 'SHOW_SELECTION_TRANSLATION') {
      const rect = getSelectionRect();
      openSelectionCard(message.original || '', rect, {
        translated: message.translated || '',
        usedEngine: message.usedEngine || 'google',
        detectedSource: message.detectedSource || '',
        phonetic: message.phonetic || '',
        dict: message.dict || [],
        targetLang: message.targetLang || selectionPrefs.targetLang
      });
      sendResponse({ ok: true });
      return false;
    }

    return false;
  });
})();
