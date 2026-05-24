/**
 * BNcraft shared core
 */
(function (global) {
  'use strict';

  const STORAGE_THEME = 'bncraft-theme';
  const STORAGE_FONT = 'bncraft-font';
  const STORAGE_SETTINGS = 'bncraft-settings';
  const STORAGE_OTHER_SETTINGS = 'bncraft-other-settings';
  const STORAGE_COOKIES = 'bncraft-cookies-accepted';

  const DEFAULT_SETTINGS = {
    showRatings: true,
    showCreator: true,
    showTypeBadge: true,
    showPrice: true,
    unavailableOverlay: false,
    pageAnimations: true,
    compactHeader: true,
    scrollProgress: true,
    simpleCardHover: false,
    showDiscordBanner: true,
    searchMode: 'name'
  };

  const DEFAULT_OTHER_SETTINGS = {
    showSource: true,
    showSize: true,
    showVersions: true,
    showDescPreview: false
  };

  const THEMES = ['blue', 'purple', 'red', 'green', 'yellow', 'orange', 'white', 'grayscale', 'pink'];
  const FONTS = ['default', 'minecraft', 'alt', 'mono', 'rounded'];

  function getSettings() {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_SETTINGS) || '{}') };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function getOtherSettings() {
    try {
      return { ...DEFAULT_OTHER_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_OTHER_SETTINGS) || '{}') };
    } catch {
      return { ...DEFAULT_OTHER_SETTINGS };
    }
  }

  function saveSettings(patch) {
    const next = { ...getSettings(), ...patch };
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(next));
    applySettingsToDocument();
    return next;
  }

  function saveOtherSettings(patch) {
    const next = { ...getOtherSettings(), ...patch };
    localStorage.setItem(STORAGE_OTHER_SETTINGS, JSON.stringify(next));
    applyOtherSettingsToDocument();
    return next;
  }

  function getSiteBase() {
    const path = global.location.pathname || '/';
    const dir = path.substring(0, path.lastIndexOf('/') + 1);
    return global.location.origin + dir;
  }

  function setTheme(theme) {
    if (!THEMES.includes(theme)) theme = 'blue';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_THEME, theme);
    document.querySelectorAll('.theme-dot').forEach((d) => {
      d.classList.toggle('active-theme', d.getAttribute('data-t') === theme);
    });
  }

  function setFont(font) {
    const f = FONTS.includes(font) ? font : 'default';
    document.documentElement.setAttribute('data-font', f);
    localStorage.setItem(STORAGE_FONT, f);
    document.querySelectorAll('.font-opt').forEach((b) => {
      b.classList.toggle('active-font', b.getAttribute('data-f') === f);
    });
  }

  function slugify(text) {
    if (!text) return 'unknown';
    return String(text).trim().replace(/[^\w\s.\-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
  }

  function buildModShareUrl(mod) {
    const name = slugify(mod.name);
    const studio = slugify(mod.studio || 'unknown');
    const uuid = mod._uuid || '';
    return `${getSiteBase()}Mods.html#/home/mods/${encodeURIComponent(name)}/${encodeURIComponent(studio)}/${uuid}`;
  }

  function buildModHash(mod) {
    const name = slugify(mod.name);
    const studio = slugify(mod.studio || 'unknown');
    const uuid = mod._uuid || '';
    return `#/home/mods/${encodeURIComponent(name)}/${encodeURIComponent(studio)}/${uuid}`;
  }

  function buildOtherModShareUrl(modOrId) {
    const id = typeof modOrId === 'string' ? modOrId : (modOrId.id || slugify(modOrId.name));
    return `${getSiteBase()}other-mods.html#/home/other-mods/${encodeURIComponent(id)}`;
  }

  function buildOtherModHash(id) {
    return `#/home/other-mods/${encodeURIComponent(id)}`;
  }

  function extractMarketplaceUuid(str) {
    const m = String(str || '').match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    return m ? m[0].toLowerCase() : null;
  }

  function parseModHash() {
    const h = global.location.hash || '';
    const uuid = extractMarketplaceUuid(h);
    if (!uuid) return null;
    const parts = h.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (parts[0] === 'home' && parts[1] === 'mods') return { uuid: uuid.toLowerCase() };
    return null;
  }

  function parseOtherModHash() {
    const parts = (global.location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
    if (parts[0] === 'home' && parts[1] === 'other-mods' && parts[2]) {
      return { id: decodeURIComponent(parts[2]) };
    }
    return null;
  }

  function updateDualRangeFill(minVal, maxVal, maxIndex, fillEl) {
    if (!fillEl || maxIndex <= 0) return;
    const minP = minVal / maxIndex;
    const maxP = maxVal / maxIndex;
    const thumb = 18;
    fillEl.style.left = 'calc(' + (minP * 100) + '% + ' + ((0.5 - minP) * thumb) + 'px)';
    fillEl.style.right = 'calc(' + ((1 - maxP) * 100) + '% + ' + ((maxP - 0.5) * thumb) + 'px)';
  }

  function setModUrl(mod, replace) {
    const hash = buildModHash(mod);
    const path = global.location.pathname + global.location.search + hash;
    const state = { modUuid: mod._uuid };
    if (replace) global.history.replaceState(state, '', path);
    else global.history.pushState(state, '', path);
  }

  function setOtherModUrl(id, replace) {
    const hash = buildOtherModHash(id);
    const path = global.location.pathname + global.location.search + hash;
    const state = { otherModId: id };
    if (replace) global.history.replaceState(state, '', path);
    else global.history.pushState(state, '', path);
  }

  function clearModUrl(replace) {
    const path = global.location.pathname + global.location.search;
    if (replace) global.history.replaceState({}, '', path);
    else global.history.pushState({}, '', path);
  }

  function clearOtherModUrl(replace) {
    clearModUrl(replace);
  }

  function copyText(text, btn) {
    const done = () => {
      if (!btn) return;
      btn.classList.add('copied');
      const tip = btn.getAttribute('title') || '';
      btn.setAttribute('title', 'Copied!');
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.setAttribute('title', tip || 'Copy link');
      }, 2000);
    };
    if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
      return global.navigator.clipboard.writeText(text).then(done).catch(() => {
        global.prompt('Copy link:', text);
        done();
      });
    }
    global.prompt('Copy link:', text);
    done();
    return Promise.resolve();
  }

  function createToggle(key, label, desc, onChange, storageKind) {
    const kind = storageKind || 'main';
    const s = kind === 'other' ? getOtherSettings() : getSettings();
    const row = document.createElement('div');
    row.className = 'settings-row';
    row.innerHTML = '<div class="settings-row-text"><div class="settings-row-title">' + label + '</div><div class="settings-row-desc">' + desc + '</div></div>';

    const labelEl = document.createElement('label');
    labelEl.className = 'switch';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'toggle';
    input.checked = !!s[key];
    input.setAttribute('aria-label', label);
    const slider = document.createElement('span');
    slider.className = 'slider';
    labelEl.appendChild(input);
    labelEl.appendChild(slider);

    input.addEventListener('change', () => {
      const next = input.checked;
      if (kind === 'other') saveOtherSettings({ [key]: next });
      else saveSettings({ [key]: next });
      if (onChange) onChange(next);
    });

    row.appendChild(labelEl);
    return row;
  }

  function applySettingsToDocument() {
    const s = getSettings();
    document.documentElement.classList.toggle('no-page-animations', !s.pageAnimations);
    document.documentElement.classList.toggle('compact-header', s.compactHeader);
    document.documentElement.classList.toggle('simple-card-hover', s.simpleCardHover);
    document.documentElement.classList.toggle('hide-scroll-progress', !s.scrollProgress);
    document.documentElement.classList.toggle('card-hide-ratings', !s.showRatings);
    document.documentElement.classList.toggle('card-hide-creator', !s.showCreator);
    document.documentElement.classList.toggle('card-hide-type', !s.showTypeBadge);
    document.documentElement.classList.toggle('card-hide-price', !s.showPrice);
    document.documentElement.classList.toggle('card-unavailable-overlay', s.unavailableOverlay);
    const bar = document.getElementById('scrollProgressBar');
    if (bar) bar.style.display = s.scrollProgress ? 'block' : 'none';
    const discord = document.getElementById('discordBanner');
    if (discord) discord.classList.toggle('is-hidden', s.showDiscordBanner === false);
  }

  function applyOtherSettingsToDocument() {
    const s = getOtherSettings();
    document.documentElement.classList.toggle('other-hide-source', !s.showSource);
    document.documentElement.classList.toggle('other-hide-size', !s.showSize);
    document.documentElement.classList.toggle('other-hide-versions', !s.showVersions);
    document.documentElement.classList.toggle('other-hide-desc', !s.showDescPreview);
    if (typeof global.renderOtherMods === 'function') global.renderOtherMods();
    if (typeof global.refreshOtherModal === 'function') global.refreshOtherModal();
  }

  function initScrollProgress() {
    let bar = document.getElementById('scrollProgressBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'scrollProgressBar';
      bar.className = 'scroll-progress-bar';
      document.body.appendChild(bar);
    }
    function onScroll() {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function openSettingsPanel() {
    var panel = document.getElementById('settingsPanel');
    var overlay = document.getElementById('settingsOverlay');
    if (panel) { panel.style.display = 'block'; void panel.offsetHeight; panel.classList.add('open'); }
    if (overlay) { overlay.style.display = 'block'; overlay.classList.add('open'); }
    document.body.classList.add('settings-open');
    if (typeof global.updateStats === 'function') global.updateStats();
  }

  function closeSettingsPanel() {
    var panel = document.getElementById('settingsPanel');
    var overlay = document.getElementById('settingsOverlay');
    if (panel) { panel.classList.remove('open'); }
    if (overlay) { overlay.classList.remove('open'); overlay.style.display = 'none'; }
    document.body.classList.remove('settings-open');
    if (panel) { setTimeout(function(){ if (!panel.classList.contains('open')) panel.style.display = 'none'; }, 320); }
  }

  function resetAllSettings(containerId, options) {
    if (!confirm('Reset theme, font, and all settings to defaults?')) return;
    localStorage.removeItem(STORAGE_SETTINGS);
    localStorage.removeItem(STORAGE_OTHER_SETTINGS);
    localStorage.setItem(STORAGE_THEME, 'blue');
    localStorage.setItem(STORAGE_FONT, 'default');
    setTheme('blue');
    setFont('default');
    buildSettingsPanel(containerId, options);
    applySettingsToDocument();
    applyOtherSettingsToDocument();
    if (typeof global.onSettingsReset === 'function') global.onSettingsReset();
    if (typeof global.filterMods === 'function') global.filterMods();
    if (typeof global.updateStats === 'function') global.updateStats();
  }

  function buildSettingsPanel(containerId, options) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    const opts = options || {};

    function section(title) {
      const sec = document.createElement('div');
      sec.className = 'settings-section';
      sec.innerHTML = '<div class="settings-section-title">' + title + '</div>';
      el.appendChild(sec);
      return sec;
    }

    if (opts.themes !== false) {
      const sec = section('THEMES');
      const row = document.createElement('div');
      row.className = 'theme-dots-row settings-theme-row';
      THEMES.forEach((t) => {
        const wrap = document.createElement('div');
        wrap.className = 'theme-dot-wrap';
        const dot = document.createElement('div');
        dot.className = 'theme-dot';
        dot.setAttribute('data-t', t);
        dot.onclick = () => setTheme(t);
        const lbl = document.createElement('div');
        lbl.className = 'theme-dot-lbl';
        lbl.textContent = t.charAt(0).toUpperCase() + t.slice(1);
        wrap.appendChild(dot);
        wrap.appendChild(lbl);
        row.appendChild(wrap);
      });
      sec.appendChild(row);
    }

    if (opts.fonts !== false) {
      const sec = section('FONTS');
      const wrap = document.createElement('div');
      wrap.className = 'font-options';
      [
        { id: 'default', label: 'Default (Inter)' },
        { id: 'minecraft', label: 'Minecraft' },
        { id: 'alt', label: 'Outfit' },
        { id: 'mono', label: 'Space Mono' },
        { id: 'rounded', label: 'Nunito' }
      ].forEach((f) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'font-opt';
        btn.setAttribute('data-f', f.id);
        btn.textContent = f.label;
        btn.onclick = () => setFont(f.id);
        wrap.appendChild(btn);
      });
      sec.appendChild(wrap);
    }

    if (opts.cardInfo) {
      const sec = section('CARD INFO');
      sec.appendChild(createToggle('showRatings', 'SHOW RATINGS', 'Star ratings on each card'));
      sec.appendChild(createToggle('showCreator', 'SHOW CREATOR', 'Creator name below title'));
      sec.appendChild(createToggle('showTypeBadge', 'SHOW TYPE BADGE', 'Content type tag on cards'));
      sec.appendChild(createToggle('showPrice', 'SHOW PRICE', 'Minecoin price on cards'));
      sec.appendChild(createToggle('unavailableOverlay', 'UNAVAILABLE OVERLAY', 'Dim cards without download', () => {
        if (typeof global.filterMods === 'function') global.filterMods();
      }));
    }

    if (opts.interface) {
      const sec = section('INTERFACE');
      sec.appendChild(createToggle('pageAnimations', 'PAGE ANIMATIONS', 'Smooth page transitions'));
      sec.appendChild(createToggle('compactHeader', 'COMPACT HEADER', 'Smaller top navigation bar'));
      sec.appendChild(createToggle('scrollProgress', 'SCROLL PROGRESS', 'Progress bar at top of page'));
      sec.appendChild(createToggle('simpleCardHover', 'SIMPLE CARD HOVER', 'Disable glow on card hover'));
      sec.appendChild(createToggle('showDiscordBanner', 'DISCORD BANNER', "Show \"Can't find the mod\" Discord section", () => {
        applySettingsToDocument();
      }));
    }

    if (opts.otherMods) {
      const sec = section('OTHER MODS');
      sec.appendChild(createToggle('showSource', 'SHOW SOURCE', 'Download source on cards', null, 'other'));
      sec.appendChild(createToggle('showSize', 'SHOW SIZE', 'File size on cards', null, 'other'));
      sec.appendChild(createToggle('showVersions', 'SHOW VERSIONS', 'Version badge on multi-version mods', null, 'other'));
      sec.appendChild(createToggle('showDescPreview', 'SHOW DESCRIPTION', 'Description preview on cards', null, 'other'));
    }

    if (opts.reset !== false) {
      const sec = document.createElement('div');
      sec.className = 'settings-section';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'reset-defaults-btn settings-reset-btn';
      btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg> Reset to Defaults';
      btn.onclick = () => resetAllSettings(containerId, options);
      sec.appendChild(btn);
      el.appendChild(sec);
    }

    setTheme(localStorage.getItem(STORAGE_THEME) || 'blue');
    setFont(localStorage.getItem(STORAGE_FONT) || 'default');
    applySettingsToDocument();
    applyOtherSettingsToDocument();
  }

  function initHamburger() {
    const menu = document.getElementById('hamburgerMenu');
    const btn = document.getElementById('hamburgerBtn');
    if (!menu || !btn) return;
    global.toggleMenu = () => {
      menu.classList.toggle('open');
      btn.classList.toggle('open');
    };
    global.closeMenu = () => {
      menu.classList.remove('open');
      btn.classList.remove('open');
    };
    if (global.BNcraft) {
      global.BNcraft.toggleMenu = global.toggleMenu;
      global.BNcraft.closeMenu = global.closeMenu;
    }
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !btn.contains(e.target)) global.closeMenu();
    });
  }

  function initCore() {
    initHamburger();
    initScrollProgress();
    const savedTheme = localStorage.getItem(STORAGE_THEME);
    if (savedTheme) setTheme(savedTheme);
    setFont(localStorage.getItem(STORAGE_FONT) || 'default');
    applySettingsToDocument();
    applyOtherSettingsToDocument();
  }

  global.BNcraft = {
    getSettings,
    getOtherSettings,
    saveSettings,
    saveOtherSettings,
    setTheme,
    setFont,
    slugify,
    getSiteBase,
    buildModShareUrl,
    buildModHash,
    buildOtherModShareUrl,
    buildOtherModHash,
    extractMarketplaceUuid,
    parseModHash,
    parseOtherModHash,
    setModUrl,
    setOtherModUrl,
    clearModUrl,
    clearOtherModUrl,
    copyText,
    updateDualRangeFill,
    applySettingsToDocument,
    applyOtherSettingsToDocument,
    openSettingsPanel,
    closeSettingsPanel,
    buildSettingsPanel,
    resetAllSettings,
    initCore,
    toggleMenu: () => global.toggleMenu && global.toggleMenu(),
    closeMenu: () => global.closeMenu && global.closeMenu(),
    DEFAULT_SETTINGS,
    DEFAULT_OTHER_SETTINGS,
    STORAGE_COOKIES
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCore);
  else initCore();
})(window);
