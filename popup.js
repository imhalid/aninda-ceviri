const I18N = {
  tr: {
    appTitle: 'Anında Çeviri',
    checking: 'Kontrol ediliyor',
    shortcutTitle: 'Hızlı Kısayol',
    tabPage: 'Sayfa',
    tabQuick: 'Sözlük',
    tabSettings: 'Ayarlar',
    engineLabel: 'Motor',
    engineAuto: 'Akıllı',
    engineApple: 'Apple Yerel',
    engineGoogle: 'Google',
    engineHintAuto: 'Önce Apple Yerel, yoksa Google',
    engineHintApple: 'Yalnızca Mac üzerinde çevrimdışı',
    engineHintGoogle: 'Tüm diller için çevrimiçi',
    targetLangLabel: 'Hedef Dil',
    translatePageBtn: 'Sayfayı Çevir',
    stopRevertBtn: 'Durdur ve Geri Al',
    retranslateBtn: 'Yeni Ayarla Çevir',
    revertBtn: 'Orijinal Sayfaya Dön',
    blockedBtn: 'Bu Sayfa Çevrilemez',
    quickPlaceholder: 'Kelime veya cümle yazın…',
    clearBtn: 'Temizle',
    translateBtn: 'Çevir',
    listenTitle: 'Sesli Dinle',
    copyTitle: 'Kopyala',
    appearanceLabel: 'Görünüm',
    themeAuto: 'Sistem',
    themeLight: 'Açık',
    themeDark: 'Koyu',
    themeHintAuto: 'Sistem teması',
    themeHintLight: 'Her zaman açık',
    themeHintDark: 'Her zaman koyu',
    uiLangLabel: 'Arayüz Dili',
    uiLangAuto: 'Oto',
    uiLangHintAuto: 'Tarayıcı dili',
    uiLangHintTr: 'Türkçe',
    uiLangHintEn: 'English',
    optObserveTitle: 'Dinamik içerik takibi',
    optObserveSub: 'Kaydırdıkça yeni metinleri çevir',
    optBubbleTitle: 'Seçili kelime balonu',
    optBubbleSub: 'Metin seçince çeviri balonu göster',
    optTitleTitle: 'Sekme başlığını çevir',
    optTitleSub: 'Tarayıcı sekme başlığını da güncelle',
    offlinePacksLabel: 'Apple Çevrimdışı Dilleri',
    bridgeTitle: 'Apple Yerel Köprüsü (Mac)',
    bridgeNotInstalled: 'Kurulu değil',
    bridgeDesc: "Çevrimdışı Apple Çeviri için aşağıdaki tek komutu Mac Terminal'e yapıştırıp çalıştırın:",
    copyCmdBtn: 'Komutu Kopyala',
    copiedBtn: 'Kopyalandı ✓',
    copyFailBtn: 'Kopyalanamadı',
    testConnBtn: 'Bağlantıyı Test Et',
    testingBtn: 'Kontrol ediliyor…',
    connectedBtn: 'Bağlandı ✓',
    notFoundBtn: 'Bulunamadı',
    packsTitle: 'Çevrimdışı Diller',
    refreshTitle: 'Durumu Yenile',
    systemBtn: 'Sistem',
    appleOfflineActive: 'Apple Yerel • Çevrimdışı',
    googleActive: 'Google Çeviri • Aktif',
    appleReady: 'Apple Yerel Hazır',
    googleReady: 'Google Çeviri Hazır',
    translatedWith: (engine, count) => `${engine} ile ${count} metin çevrildi`,
    fallbackNotInstalled: (pair) =>
      pair
        ? `${pair} paketi Mac'te yüklü değil, Google kullanıldı.`
        : `Dil paketi Mac'te yüklü değil, Google kullanıldı.`,
    fallbackUnsupported: 'Bu dil çifti Apple Yerel tarafından desteklenmediği için Google kullanıldı.',
    downloadAction: 'İndir',
    confirmAction: 'Onaylayın…',
    installedBadge: 'Yüklü',
    packsCount: (inst, total) => `${inst}/${total} Yüklü`,
    packsSubText: (target) => `Hedef dil (${target}) için Mac üzerindeki çevrimdışı paketler.`,
    noTabErr: 'Aktif sekme bulunamadı.',
    restrictedErr: 'Sistem sayfaları çevrilemez; Sözlük sekmesini kullanabilirsiniz.',
    accessErr: 'Sayfaya erişilemiyor. Sayfayı yenileyip tekrar deneyin.',
    translateFailErr: 'Sayfa çevrilemedi.',
    genericErr: 'Çeviri sırasında hata oluştu.',
    srcAuto: 'OTO'
  },
  en: {
    appTitle: 'Instant Translator',
    checking: 'Checking…',
    shortcutTitle: 'Quick Shortcut',
    tabPage: 'Page',
    tabQuick: 'Dictionary',
    tabSettings: 'Settings',
    engineLabel: 'Engine',
    engineAuto: 'Smart',
    engineApple: 'Apple Local',
    engineGoogle: 'Google',
    engineHintAuto: 'Apple Local first, Google fallback',
    engineHintApple: 'Offline on this Mac only',
    engineHintGoogle: 'Online for all languages',
    targetLangLabel: 'Target Language',
    translatePageBtn: 'Translate Page',
    stopRevertBtn: 'Stop & Revert',
    retranslateBtn: 'Apply & Retranslate',
    revertBtn: 'Revert to Original',
    blockedBtn: 'Cannot Translate Page',
    quickPlaceholder: 'Type a word or sentence…',
    clearBtn: 'Clear',
    translateBtn: 'Translate',
    listenTitle: 'Listen',
    copyTitle: 'Copy',
    appearanceLabel: 'Appearance',
    themeAuto: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeHintAuto: 'Follows system',
    themeHintLight: 'Always light',
    themeHintDark: 'Always dark',
    uiLangLabel: 'Interface Language',
    uiLangAuto: 'Auto',
    uiLangHintAuto: 'Browser language',
    uiLangHintTr: 'Türkçe',
    uiLangHintEn: 'English',
    optObserveTitle: 'Track dynamic content',
    optObserveSub: 'Translate new items as you scroll',
    optBubbleTitle: 'Selection lookup bubble',
    optBubbleSub: 'Show translate button on text selection',
    optTitleTitle: 'Translate tab title',
    optTitleSub: 'Update browser tab title as well',
    offlinePacksLabel: 'Apple Offline Languages',
    bridgeTitle: 'Apple Local Bridge (Mac)',
    bridgeNotInstalled: 'Not installed',
    bridgeDesc: 'Paste and run this single command in Mac Terminal to enable offline Apple Translation:',
    copyCmdBtn: 'Copy Command',
    copiedBtn: 'Copied ✓',
    copyFailBtn: 'Copy failed',
    testConnBtn: 'Test Connection',
    testingBtn: 'Checking…',
    connectedBtn: 'Connected ✓',
    notFoundBtn: 'Not found',
    packsTitle: 'Offline Languages',
    refreshTitle: 'Refresh Status',
    systemBtn: 'System',
    appleOfflineActive: 'Apple Local • Offline',
    googleActive: 'Google Translate • Active',
    appleReady: 'Apple Local Ready',
    googleReady: 'Google Translate Ready',
    translatedWith: (engine, count) => `Translated ${count} items via ${engine}`,
    fallbackNotInstalled: (pair) =>
      pair
        ? `${pair} pack isn't installed on Mac; used Google.`
        : `Language pack isn't installed on Mac; used Google.`,
    fallbackUnsupported: 'Language pair unsupported by Apple Local; used Google.',
    downloadAction: 'Download',
    confirmAction: 'Confirm…',
    installedBadge: 'Installed',
    packsCount: (inst, total) => `${inst}/${total} Installed`,
    packsSubText: (target) => `Offline packs on this Mac for target (${target}).`,
    noTabErr: 'No active tab found.',
    restrictedErr: 'System pages cannot be translated; use the Dictionary tab.',
    accessErr: 'Cannot access this page. Reload and try again.',
    translateFailErr: 'Could not translate page.',
    genericErr: 'An error occurred while translating.',
    srcAuto: 'AUTO'
  }
};

const LANGUAGES = [
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
  ['zh-CN', 'ZH', { tr: 'Çince', en: 'Chinese' }],
  ['nl', 'NL', { tr: 'Felemenkçe', en: 'Dutch' }],
  ['pl', 'PL', { tr: 'Lehçe', en: 'Polish' }],
  ['uk', 'UK', { tr: 'Ukraynaca', en: 'Ukrainian' }]
];

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
  'zh-CN': 'zh-CN',
  nl: 'nl-NL',
  pl: 'pl-PL',
  uk: 'uk-UA'
};

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

const COPY_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

const statusDot = document.getElementById('statusDot');
const engineStatusText = document.getElementById('engineStatusText');

const tabSegment = document.getElementById('tabSegment');
const tabButtons = Array.from(document.querySelectorAll('#tabSegment .nav-tab'));
const panelPage = document.getElementById('panelPage');
const panelQuick = document.getElementById('panelQuick');
const panelSettings = document.getElementById('panelSettings');
const panelPacks = document.getElementById('panelPacks');

const engineSegment = document.getElementById('engineSegment');
const engineHint = document.getElementById('engineHint');
const engineButtons = Array.from(document.querySelectorAll('#engineSegment .seg-btn'));

const themeSegment = document.getElementById('themeSegment');
const themeHint = document.getElementById('themeHint');
const themeButtons = Array.from(document.querySelectorAll('#themeSegment .seg-btn'));

const uiLangSegment = document.getElementById('uiLangSegment');
const uiLangHint = document.getElementById('uiLangHint');
const uiLangButtons = Array.from(document.querySelectorAll('#uiLangSegment .seg-btn'));

const langSelectWrap = document.getElementById('langSelect');
const langTrigger = document.getElementById('langTrigger');
const langCodePill = document.getElementById('langCodePill');
const langLabelText = document.getElementById('langLabelText');
const langMenu = document.getElementById('langMenu');

const translatedBanner = document.getElementById('translatedBanner');
const translatedBannerText = document.getElementById('translatedBannerText');
const actionBtn = document.getElementById('actionBtn');
const actionBtnText = document.getElementById('actionBtnText');
const progressWrap = document.getElementById('progressWrap');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const messageBox = document.getElementById('messageBox');

const autoObserveEl = document.getElementById('autoObserve');
const selectionPopupEl = document.getElementById('selectionPopup');
const translateTitleEl = document.getElementById('translateTitle');

const packsCard = document.getElementById('packsCard');
const openPacksBtn = document.getElementById('openPacksBtn');
const packsSummary = document.getElementById('packsSummary');
const packsBackBtn = document.getElementById('packsBackBtn');
const packsRefreshBtn = document.getElementById('packsRefreshBtn');
const packsSettingsBtn = document.getElementById('packsSettingsBtn');
const packsSub = document.getElementById('packsSub');
const packsList = document.getElementById('packsList');

const bridgeSetupCard = document.getElementById('bridgeSetupCard');
const bridgeCmdText = document.getElementById('bridgeCmdText');
const copyBridgeBtn = document.getElementById('copyBridgeBtn');
const recheckBridgeBtn = document.getElementById('recheckBridgeBtn');

const quickInput = document.getElementById('quickInput');
const quickClearBtn = document.getElementById('quickClearBtn');
const quickTranslateBtn = document.getElementById('quickTranslateBtn');
const quickResultCard = document.getElementById('quickResultCard');
const quickSrcBadge = document.getElementById('quickSrcBadge');
const quickPhonetic = document.getElementById('quickPhonetic');
const quickSpeakBtn = document.getElementById('quickSpeakBtn');
const quickCopyBtn = document.getElementById('quickCopyBtn');
const quickTranslation = document.getElementById('quickTranslation');
const quickDict = document.getElementById('quickDict');
const quickError = document.getElementById('quickError');

let activeTabId = null;
let appleHostReady = false;
let currentEngine = 'auto';
let currentTheme = 'auto';
let currentUiLangSetting = 'auto';
let resolvedUiLang = 'en';
let currentTargetLang = 'tr';
let currentTabMode = 'page';
let packsOpen = false;
let packsPollTimer = null;
let downloadingCode = null;
let cachedPacks = null;
let pageBlocked = false;
let pageBlockedReason = null;
let lastQuickResult = '';
let lastQuickDict = [];
let lastQuickDetected = '';

let pageState = {
  isTranslated: false,
  isTranslating: false,
  targetLang: 'tr',
  engine: 'auto',
  usedEngine: null,
  fallbackReason: null,
  fallbackPair: null,
  translatedCount: 0,
  progress: 0
};

function t(key) {
  return I18N[resolvedUiLang]?.[key] ?? I18N.en[key] ?? key;
}

function resolveUiLang(setting) {
  if (setting === 'tr' || setting === 'en') return setting;
  const nav = (navigator.language || 'en').toLowerCase();
  return nav.startsWith('tr') ? 'tr' : 'en';
}

function formatLocalizedLangName(code, fallbackName) {
  try {
    const dn = new Intl.DisplayNames([resolvedUiLang], { type: 'language' });
    const formatted = dn.of(code);
    if (formatted) {
      return formatted.charAt(0).toLocaleUpperCase(resolvedUiLang) + formatted.slice(1);
    }
  } catch {
    // Fallback below
  }
  return fallbackName || code;
}

function applyUiLanguage(setting) {
  currentUiLangSetting = setting || 'auto';
  resolvedUiLang = resolveUiLang(currentUiLangSetting);
  document.documentElement.lang = resolvedUiLang;

  const idxMap = { auto: '0', tr: '1', en: '2' };
  uiLangSegment.dataset.index = idxMap[currentUiLangSetting] || '0';
  uiLangButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.uiLang === currentUiLangSetting);
  });

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const val = t(el.dataset.i18n);
    if (typeof val === 'string') el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const val = t(el.dataset.i18nPlaceholder);
    if (typeof val === 'string') el.placeholder = val;
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const val = t(el.dataset.i18nTitle);
    if (typeof val === 'string') el.title = val;
  });

  const hintKey = {
    auto: 'uiLangHintAuto',
    tr: 'uiLangHintTr',
    en: 'uiLangHintEn'
  }[currentUiLangSetting];
  uiLangHint.textContent = t(hintKey || 'uiLangHintAuto');

  setSelectedEngine(currentEngine);
  applyTheme(currentTheme);
  setTargetLang(currentTargetLang);
  if (!lastQuickDetected) {
    quickSrcBadge.textContent = t('srcAuto');
  }
  if (lastQuickDict.length > 0) {
    renderQuickDict(lastQuickDict);
  }
  if (cachedPacks) {
    renderPacksList(cachedPacks, currentTargetLang);
  }
  if (pageBlocked && pageBlockedReason) {
    showMessage(t(pageBlockedReason), pageBlockedReason === 'restrictedErr');
  }
  renderUI();
}

const systemDarkMedia = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme) {
  currentTheme = theme || 'auto';
  const resolved =
    currentTheme === 'auto'
      ? systemDarkMedia.matches
        ? 'dark'
        : 'light'
      : currentTheme;
  document.documentElement.setAttribute('data-theme', resolved);
  const hintKey = { auto: 'themeHintAuto', light: 'themeHintLight', dark: 'themeHintDark' }[
    currentTheme
  ];
  themeHint.textContent = t(hintKey || 'themeHintAuto');
  const idxMap = { auto: '0', light: '1', dark: '2' };
  themeSegment.dataset.index = idxMap[currentTheme] || '0';
  themeButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.themeChoice === currentTheme);
  });
}

systemDarkMedia.addEventListener('change', () => {
  if (currentTheme === 'auto') {
    applyTheme('auto');
  }
});

function showMessage(text, isInfo = false, actionLabel = null, onAction = null) {
  if (!text) {
    messageBox.classList.add('hidden');
    messageBox.classList.remove('info', 'notice-flex');
    messageBox.innerHTML = '';
    return;
  }

  messageBox.innerHTML = '';
  messageBox.classList.remove('hidden');
  messageBox.classList.toggle('info', isInfo);

  if (actionLabel && typeof onAction === 'function') {
    messageBox.classList.add('notice-flex');
    const span = document.createElement('span');
    span.textContent = text;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'notice-action';
    btn.textContent = actionLabel;
    btn.addEventListener('click', onAction);
    messageBox.append(span, btn);
  } else {
    messageBox.classList.remove('notice-flex');
    messageBox.textContent = text;
  }
}

function setSelectedEngine(engine) {
  currentEngine = engine || 'auto';
  const hintKey = {
    auto: 'engineHintAuto',
    apple: 'engineHintApple',
    google: 'engineHintGoogle'
  }[currentEngine];
  engineHint.textContent = t(hintKey || 'engineHintAuto');
  const idxMap = { auto: '0', apple: '1', google: '2' };
  engineSegment.dataset.index = idxMap[currentEngine] || '0';
  engineButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.engine === currentEngine);
  });
}

function renderLangMenu() {
  langMenu.innerHTML = '';
  for (const [code, shortCode, labels] of LANGUAGES) {
    const label = labels[resolvedUiLang] || labels.en;
    const opt = document.createElement('button');
    opt.type = 'button';
    opt.role = 'option';
    opt.className = 'select-option' + (code === currentTargetLang ? ' selected' : '');
    opt.setAttribute('aria-selected', String(code === currentTargetLang));
    opt.innerHTML = `
      <span class="select-option-left">
        <span class="code-pill">${shortCode}</span>
        <span>${label}</span>
      </span>
      <svg class="select-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    `;
    opt.addEventListener('click', async () => {
      setTargetLang(code);
      closeLangMenu();
      await chrome.storage.local.set({ targetLang: code });
      if (appleHostReady) loadApplePacks();
      renderUI();
    });
    langMenu.appendChild(opt);
  }
}

function setTargetLang(code) {
  const found = LANGUAGES.find(([c]) => c === code) || LANGUAGES[0];
  currentTargetLang = found[0];
  langCodePill.textContent = found[1];
  langLabelText.textContent = found[2][resolvedUiLang] || found[2].en;
  renderLangMenu();
}

function openLangMenu() {
  renderLangMenu();
  langMenu.classList.remove('hidden');
  langTrigger.setAttribute('aria-expanded', 'true');
}

function closeLangMenu() {
  langMenu.classList.add('hidden');
  langTrigger.setAttribute('aria-expanded', 'false');
}

function updateSubtitle() {
  if (pageState.isTranslated && pageState.usedEngine) {
    statusDot.classList.add('ready');
    engineStatusText.textContent =
      pageState.usedEngine === 'apple' ? t('appleOfflineActive') : t('googleActive');
    return;
  }

  if (appleHostReady) {
    statusDot.classList.add('ready');
    engineStatusText.textContent = t('appleReady');
  } else {
    statusDot.classList.remove('ready');
    engineStatusText.textContent = t('googleReady');
  }
}

function renderFallbackHint() {
  if (!pageState.isTranslated || !pageState.fallbackReason) return;
  if (pageState.fallbackReason === 'NOT_INSTALLED') {
    const pair = pageState.fallbackPair || '';
    const srcCode = pair.split('→')[0]?.trim();
    const tgtCode = pair.split('→')[1]?.trim() || currentTargetLang;
    const msg = t('fallbackNotInstalled')(pair);
    if (appleHostReady && srcCode) {
      showMessage(msg, true, t('downloadAction'), () => triggerPackDownload(srcCode, tgtCode));
    } else {
      showMessage(msg, true);
    }
  } else if (pageState.fallbackReason === 'UNSUPPORTED') {
    showMessage(t('fallbackUnsupported'), true);
  }
}

function renderUI() {
  updateSubtitle();

  if (pageBlocked) {
    translatedBanner.classList.add('hidden');
    actionBtn.disabled = true;
    actionBtnText.textContent = t('blockedBtn');
    actionBtn.className = 'btn btn-secondary';
    progressWrap.classList.add('hidden');
    return;
  }

  actionBtn.disabled = false;

  if (pageState.isTranslating) {
    translatedBanner.classList.add('hidden');
    actionBtnText.textContent = t('stopRevertBtn');
    actionBtn.className = 'btn btn-secondary';
    progressWrap.classList.remove('hidden');
    const pct = Math.max(5, Math.min(100, pageState.progress || 0));
    progressBar.style.width = `${pct}%`;
    progressText.textContent = `%${pct}`;
  } else if (pageState.isTranslated) {
    const engineName = pageState.usedEngine === 'apple' ? t('engineApple') : t('engineGoogle');
    translatedBannerText.textContent = t('translatedWith')(engineName, pageState.translatedCount);
    translatedBanner.classList.remove('hidden');
    progressWrap.classList.add('hidden');

    if (
      currentTargetLang !== pageState.targetLang ||
      currentEngine !== pageState.engine
    ) {
      actionBtnText.textContent = t('retranslateBtn');
      actionBtn.className = 'btn btn-primary';
    } else {
      actionBtnText.textContent = t('revertBtn');
      actionBtn.className = 'btn btn-secondary';
    }

    renderFallbackHint();
  } else {
    translatedBanner.classList.add('hidden');
    actionBtnText.textContent = t('translatePageBtn');
    actionBtn.className = 'btn btn-primary';
    progressWrap.classList.add('hidden');
  }
}

function switchTab(tab) {
  currentTabMode = tab;
  if (packsOpen) {
    packsOpen = false;
    clearInterval(packsPollTimer);
    packsPollTimer = null;
    panelPacks.classList.add('hidden');
  }

  const idxMap = { page: '0', quick: '1', settings: '2' };
  tabSegment.dataset.index = idxMap[tab] || '0';
  tabButtons.forEach((btn) => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  panelPage.classList.toggle('hidden', tab !== 'page');
  panelQuick.classList.toggle('hidden', tab !== 'quick');
  panelSettings.classList.toggle('hidden', tab !== 'settings');
  tabSegment.classList.remove('hidden');

  if (tab === 'quick') {
    quickInput.focus();
  }
}

function renderPacksList(packs, targetCode) {
  cachedPacks = packs;
  const installedCount = packs.filter((p) => p.status === 'installed').length;
  packsSummary.textContent = t('packsCount')(installedCount, packs.length);
  const targetFound = LANGUAGES.find(([c]) => c === currentTargetLang);
  const targetLabel = targetFound
    ? targetFound[2][resolvedUiLang] || targetFound[2].en
    : (targetCode || 'TR').toUpperCase();
  packsSub.textContent = t('packsSubText')(targetLabel);

  packsList.innerHTML = '';
  packs.forEach((pack, index) => {
    if (index > 0) {
      const div = document.createElement('div');
      div.className = 'hairline';
      packsList.appendChild(div);
    }

    const row = document.createElement('div');
    row.className = 'pack-row';

    const left = document.createElement('div');
    left.className = 'pack-left';
    const pill = document.createElement('span');
    pill.className = 'code-pill';
    pill.textContent = pack.code.toUpperCase();
    const name = document.createElement('span');
    name.className = 'pack-name';
    name.textContent = formatLocalizedLangName(pack.code, pack.name);
    left.append(pill, name);

    row.appendChild(left);

    if (pack.status === 'installed') {
      const badge = document.createElement('span');
      badge.className = 'pack-installed';
      badge.innerHTML = `${CHECK_SVG}<span>${t('installedBadge')}</span>`;
      row.appendChild(badge);
    } else {
      const dlBtn = document.createElement('button');
      dlBtn.type = 'button';
      dlBtn.className = 'pack-dl-btn';
      const isPending = downloadingCode === pack.code;
      dlBtn.textContent = isPending ? t('confirmAction') : t('downloadAction');
      dlBtn.disabled = isPending;
      dlBtn.addEventListener('click', () => triggerPackDownload(pack.code, targetCode || currentTargetLang));
      row.appendChild(dlBtn);
    }

    packsList.appendChild(row);
  });
}

async function loadApplePacks() {
  if (!appleHostReady) return;
  try {
    const res = await chrome.runtime.sendMessage({
      type: 'GET_APPLE_LANGUAGES',
      targetLang: currentTargetLang
    });
    if (res?.ok && Array.isArray(res.languagePacks)) {
      if (downloadingCode) {
        const matched = res.languagePacks.find((p) => p.code === downloadingCode);
        if (matched?.status === 'installed') {
          downloadingCode = null;
          clearInterval(packsPollTimer);
          packsPollTimer = null;
        }
      }
      renderPacksList(res.languagePacks, res.targetLang);
    }
  } catch {
    // Ignore
  }
}

async function triggerPackDownload(sourceLang, targetLang) {
  downloadingCode = sourceLang;
  loadApplePacks();
  try {
    await chrome.runtime.sendMessage({
      type: 'DOWNLOAD_APPLE_LANGUAGE',
      sourceLang,
      targetLang
    });
    clearInterval(packsPollTimer);
    let checks = 0;
    packsPollTimer = setInterval(() => {
      checks += 1;
      loadApplePacks();
      if (checks >= 20) {
        clearInterval(packsPollTimer);
        packsPollTimer = null;
        downloadingCode = null;
      }
    }, 2000);
  } catch {
    downloadingCode = null;
    loadApplePacks();
  }
}

function openPacksPanel() {
  packsOpen = true;
  tabSegment.classList.add('hidden');
  panelPage.classList.add('hidden');
  panelQuick.classList.add('hidden');
  panelSettings.classList.add('hidden');
  panelPacks.classList.remove('hidden');
  loadApplePacks();
}

function closePacksPanel() {
  switchTab('settings');
}

async function ensureContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js']
  });
}

async function checkAppleHost() {
  try {
    const res = await chrome.runtime.sendMessage({ type: 'CHECK_APPLE_HOST' });
    appleHostReady = Boolean(res?.ok);
  } catch {
    appleHostReady = false;
  }
  packsCard.classList.toggle('hidden', !appleHostReady);
  bridgeSetupCard.classList.toggle('hidden', appleHostReady);
  if (appleHostReady) {
    loadApplePacks();
  }
  updateSubtitle();
}

function renderQuickDict(dict) {
  quickDict.innerHTML = '';
  const posMap = POS_LABELS[resolvedUiLang] || POS_LABELS.en;
  for (const group of dict) {
    const block = document.createElement('div');
    const pos = document.createElement('div');
    pos.className = 'dict-pos';
    pos.textContent = posMap[group.pos.toLowerCase()] || group.pos;

    const chips = document.createElement('div');
    chips.className = 'dict-chips';
    for (const term of group.terms || []) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'dict-chip';
      chip.textContent = term;
      chip.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(term);
          chip.textContent = `${term} ✓`;
          setTimeout(() => (chip.textContent = term), 900);
        } catch {
          // Ignore
        }
      });
      chips.appendChild(chip);
    }
    block.append(pos, chips);
    quickDict.appendChild(block);
  }
}

async function runQuickTranslate() {
  const text = quickInput.value.trim();
  if (!text) return;

  quickError.classList.add('hidden');
  quickTranslateBtn.disabled = true;
  quickTranslateBtn.textContent = '…';

  try {
    const res = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_SELECTION',
      text,
      targetLang: currentTargetLang,
      engine: currentEngine
    });

    if (!res?.ok) {
      throw new Error(res?.error || t('genericErr'));
    }

    lastQuickResult = res.translated || '';
    lastQuickDetected = res.detectedSource || '';
    quickSrcBadge.textContent = (lastQuickDetected || t('srcAuto')).toUpperCase();
    if (res.phonetic) {
      quickPhonetic.textContent = `/${res.phonetic}/`;
      quickPhonetic.classList.remove('hidden');
    } else {
      quickPhonetic.classList.add('hidden');
    }

    quickTranslation.textContent = lastQuickResult;
    lastQuickDict = Array.isArray(res.dict) ? res.dict : [];
    renderQuickDict(lastQuickDict);

    quickResultCard.classList.remove('hidden');
  } catch (err) {
    quickResultCard.classList.add('hidden');
    quickError.textContent = err?.message || t('genericErr');
    quickError.classList.remove('hidden');
  } finally {
    quickTranslateBtn.disabled = false;
    quickTranslateBtn.textContent = t('translateBtn');
  }
}

async function init() {
  const stored = await chrome.storage.local.get({
    targetLang: 'tr',
    autoObserve: true,
    selectionPopup: true,
    translateTitle: true,
    theme: 'auto',
    uiLang: 'auto',
    engine: 'auto'
  });

  currentTheme = stored.theme || 'auto';
  currentTargetLang = stored.targetLang || 'tr';
  currentEngine = stored.engine || 'auto';
  autoObserveEl.checked = Boolean(stored.autoObserve);
  selectionPopupEl.checked = Boolean(stored.selectionPopup);
  translateTitleEl.checked = Boolean(stored.translateTitle);

  applyUiLanguage(stored.uiLang || 'auto');

  checkAppleHost();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) {
    pageBlocked = true;
    pageBlockedReason = 'noTabErr';
    showMessage(t('noTabErr'));
    renderUI();
    return;
  }

  const restricted =
    /^(chrome|chrome-extension|edge|about|view-source|devtools):/i.test(tab.url) ||
    tab.url.startsWith('https://chromewebstore.google.com');

  if (restricted) {
    pageBlocked = true;
    pageBlockedReason = 'restrictedErr';
    showMessage(t('restrictedErr'), true);
    renderUI();
    return;
  }

  activeTabId = tab.id;

  try {
    await ensureContentScript(activeTabId);
    const status = await chrome.tabs.sendMessage(activeTabId, { type: 'GET_STATUS' });
    if (status?.ok) {
      pageState = {
        isTranslated: status.isTranslated,
        isTranslating: status.isTranslating,
        targetLang: status.targetLang || currentTargetLang,
        engine: status.engine || currentEngine,
        usedEngine: status.usedEngine || null,
        fallbackReason: status.fallbackReason || null,
        fallbackPair: status.fallbackPair || null,
        translatedCount: status.translatedCount || 0,
        progress: status.isTranslating ? 15 : status.isTranslated ? 100 : 0
      };
      if (status.lastError) {
        showMessage(status.lastError);
      }
    }
  } catch {
    pageBlocked = true;
    pageBlockedReason = 'accessErr';
    showMessage(t('accessErr'));
  }

  renderUI();
}

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

openPacksBtn.addEventListener('click', openPacksPanel);
packsBackBtn.addEventListener('click', closePacksPanel);
packsRefreshBtn.addEventListener('click', () => {
  downloadingCode = null;
  loadApplePacks();
});
packsSettingsBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'OPEN_APPLE_SETTINGS' }).catch(() => {});
});

copyBridgeBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(bridgeCmdText.textContent.trim());
    copyBridgeBtn.textContent = t('copiedBtn');
    setTimeout(() => (copyBridgeBtn.textContent = t('copyCmdBtn')), 1500);
  } catch {
    copyBridgeBtn.textContent = t('copyFailBtn');
  }
});

recheckBridgeBtn.addEventListener('click', async () => {
  recheckBridgeBtn.disabled = true;
  recheckBridgeBtn.textContent = t('testingBtn');
  await checkAppleHost();
  recheckBridgeBtn.disabled = false;
  recheckBridgeBtn.textContent = appleHostReady ? t('connectedBtn') : t('notFoundBtn');
  setTimeout(() => {
    recheckBridgeBtn.textContent = t('testConnBtn');
  }, 1500);
});

langTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  if (langMenu.classList.contains('hidden')) {
    openLangMenu();
  } else {
    closeLangMenu();
  }
});

document.addEventListener('click', (e) => {
  if (!langSelectWrap.contains(e.target)) {
    closeLangMenu();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLangMenu();
  }
});

engineButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const engine = btn.dataset.engine;
    setSelectedEngine(engine);
    await chrome.storage.local.set({ engine });
    renderUI();
  });
});

themeButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const theme = btn.dataset.themeChoice;
    applyTheme(theme);
    await chrome.storage.local.set({ theme });
  });
});

uiLangButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const uiLang = btn.dataset.uiLang;
    applyUiLanguage(uiLang);
    await chrome.storage.local.set({ uiLang });
  });
});

autoObserveEl.addEventListener('change', async () => {
  const autoObserve = autoObserveEl.checked;
  await chrome.storage.local.set({ autoObserve });
  if (activeTabId && !pageBlocked) {
    chrome.tabs.sendMessage(activeTabId, { type: 'SET_AUTO_OBSERVE', autoObserve }).catch(() => {});
  }
});

selectionPopupEl.addEventListener('change', async () => {
  const selectionPopup = selectionPopupEl.checked;
  await chrome.storage.local.set({ selectionPopup });
});

translateTitleEl.addEventListener('change', async () => {
  const translateTitle = translateTitleEl.checked;
  await chrome.storage.local.set({ translateTitle });
});

actionBtn.addEventListener('click', async () => {
  if (!activeTabId || pageBlocked) return;
  showMessage('');

  const autoObserve = autoObserveEl.checked;
  const translateTitle = translateTitleEl.checked;

  try {
    await ensureContentScript(activeTabId);

    const sameSettings =
      currentTargetLang === pageState.targetLang && currentEngine === pageState.engine;

    if (pageState.isTranslating || (pageState.isTranslated && sameSettings)) {
      await chrome.tabs.sendMessage(activeTabId, { type: 'REVERT_PAGE' });
      pageState.isTranslated = false;
      pageState.isTranslating = false;
      pageState.translatedCount = 0;
      pageState.usedEngine = null;
      pageState.fallbackReason = null;
      pageState.fallbackPair = null;
      pageState.progress = 0;
      renderUI();
      return;
    }

    pageState.isTranslating = true;
    pageState.targetLang = currentTargetLang;
    pageState.engine = currentEngine;
    pageState.usedEngine = null;
    pageState.fallbackReason = null;
    pageState.fallbackPair = null;
    pageState.progress = 5;
    renderUI();

    await chrome.tabs.sendMessage(activeTabId, {
      type: 'TRANSLATE_PAGE',
      targetLang: currentTargetLang,
      autoObserve,
      translateTitle,
      engine: currentEngine
    });
  } catch (err) {
    pageState.isTranslating = false;
    showMessage(err?.message || t('translateFailErr'));
    renderUI();
  }
});

quickInput.addEventListener('input', () => {
  quickClearBtn.classList.toggle('hidden', !quickInput.value.trim());
});

quickInput.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    runQuickTranslate();
  }
});

quickClearBtn.addEventListener('click', () => {
  quickInput.value = '';
  quickClearBtn.classList.add('hidden');
  quickResultCard.classList.add('hidden');
  quickError.classList.add('hidden');
  quickInput.focus();
});

quickTranslateBtn.addEventListener('click', runQuickTranslate);

quickCopyBtn.addEventListener('click', async () => {
  if (!lastQuickResult) return;
  try {
    await navigator.clipboard.writeText(lastQuickResult);
    quickCopyBtn.innerHTML = CHECK_SVG;
    quickCopyBtn.classList.add('active');
    setTimeout(() => {
      quickCopyBtn.innerHTML = COPY_SVG;
      quickCopyBtn.classList.remove('active');
    }, 1100);
  } catch {
    // Ignore
  }
});

quickSpeakBtn.addEventListener('click', () => {
  if (!lastQuickResult || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  setTimeout(() => {
    const utter = new SpeechSynthesisUtterance(lastQuickResult);
    utter.lang = SPEECH_LOCALE[currentTargetLang] || currentTargetLang;
    utter.rate = 0.96;
    window.speechSynthesis.speak(utter);
  }, 20);
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.tab?.id && sender.tab.id !== activeTabId) return;

  if (message?.type === 'TRANSLATION_STATUS') {
    pageState.isTranslated = Boolean(message.isTranslated);
    pageState.isTranslating = Boolean(message.isTranslating);
    pageState.translatedCount = message.translatedCount ?? pageState.translatedCount;
    pageState.usedEngine = message.usedEngine ?? pageState.usedEngine;
    pageState.fallbackReason = message.fallbackReason ?? pageState.fallbackReason;
    pageState.fallbackPair = message.fallbackPair ?? pageState.fallbackPair;
    pageState.progress = message.progress ?? pageState.progress;
    renderUI();
  } else if (message?.type === 'TRANSLATION_ERROR') {
    pageState.isTranslating = false;
    showMessage(message.error || t('genericErr'));
    renderUI();
  }
});

init();
