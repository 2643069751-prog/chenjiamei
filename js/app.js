/* ========================================
   声优资料库 - 主逻辑
   ======================================== */

(function () {
  'use strict';

  // ---------- 全局状态 ----------
  let allData = null;       // 原始 JSON 数据
  let filteredList = [];    // 筛选后的声优列表
  let currentFilters = {
    gender: 'all',
    voiceTypes: [],
    tags: [],
    tiers: [],
    search: ''
  };

  // ---------- 颜色方案（用于动态头像） ----------
  const AVATAR_COLORS = [
    ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'], ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'], ['#a18cd1', '#fbc2eb'],
    ['#fccb90', '#d57eeb'], ['#e0c3fc', '#8ec5fc'], ['#f5576c', '#ff6b6b'],
    ['#667eea', '#48c6ef'], ['#ff9a9e', '#fecfef'], ['#a1c4fd', '#c2e9fb'],
    ['#d4fc79', '#96e6a1'], ['#84fab0', '#8fd3f4'], ['#fbc2eb', '#a6c1ee'],
    ['#fdcbf1', '#e6dee9'], ['#a6c0fe', '#f68084'], ['#fccb90', '#d57eeb'],
    ['#e8dff5', '#fce2ce'], ['#c2e9fb', '#a1c4fd'], ['#96e6a1', '#d4fc79'],
    ['#f6d365', '#fda085'], ['#89f7fe', '#66a6ff'], ['#fddb92', '#d1fdff']
  ];

  // ---------- DOM 引用 ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    searchInput: $('#search-input'),
    searchClear: $('#search-clear'),
    genderFilters: $('#gender-filters'),
    voiceFilters: $('#voice-filters'),
    tagFilters: $('#tag-filters'),
    tierFilters: $('#tier-filters'),
    seiyuuGrid: $('#seiyuu-grid'),
    emptyState: $('#empty-state'),
    resultCount: $('#result-count'),
    clearFilters: $('#clear-filters'),
    resetBtn: $('#reset-btn'),
    detailContent: $('#detail-content'),
    backBtn: $('#back-btn'),
    logoLink: $('#logo-link'),
    slamdunkSection: $('#slamdunk-section'),
    slamdunkContent: $('#slamdunk-content'),
  };

  const SLAMDUNK_TAG = '灌篮高手电影版本';

  // ---------- 初始化 ----------
  async function init() {
    try {
      allData = await loadData();
      renderFilterOptions();
      bindEvents();
      applyFilters();
    } catch (err) {
      console.error('加载数据失败:', err);
      dom.seiyuuGrid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-icon">⚠️</span>
          <p>数据加载失败，请确认 <code>data/seiyuu-data.json</code> 文件存在</p>
        </div>`;
    }
  }

  // ---------- 加载数据 ----------
  async function loadData() {
    const resp = await fetch('data/seiyuu-data.json');
    if (!resp.ok) throw new Error('JSON 加载失败');
    return resp.json();
  }

  // ---------- 渲染筛选选项 ----------
  function renderFilterOptions() {
    const voiceTypes = allData.filters.voiceTypes;
    const tags = allData.filters.tags;

    dom.voiceFilters.innerHTML = `<button class="filter-tag active" data-filter="voiceTypes" data-value="all">全部</button>` +
      voiceTypes.map(v => `<button class="filter-tag" data-filter="voiceTypes" data-value="${v}">${v}</button>`).join('');

    dom.tagFilters.innerHTML = `<button class="filter-tag active" data-filter="tags" data-value="all">全部</button>` +
      tags.map(t => `<button class="filter-tag" data-filter="tags" data-value="${t}">${t}</button>`).join('');

    const tiers = allData.filters.tiers || ['一线', '准一线', '新生代'];
    dom.tierFilters.innerHTML = `<button class="filter-tag active" data-filter="tiers" data-value="all">全部</button>` +
      tiers.map(t => `<button class="filter-tag" data-filter="tiers" data-value="${t}">${t}</button>`).join('');
  }

  // ---------- 事件绑定 ----------
  function bindEvents() {
    // 搜索
    dom.searchInput.addEventListener('input', debounce(function () {
      currentFilters.search = this.value.trim();
      dom.searchClear.classList.toggle('visible', this.value.length > 0);
      applyFilters();
    }, 200));

    dom.searchClear.addEventListener('click', () => {
      dom.searchInput.value = '';
      currentFilters.search = '';
      dom.searchClear.classList.remove('visible');
      applyFilters();
      dom.searchInput.focus();
    });

    // 筛选标签点击
    document.addEventListener('click', (e) => {
      const tag = e.target.closest('.filter-tag');
      if (!tag) return;

      const filterType = tag.dataset.filter;
      const value = tag.dataset.value;

      if (filterType === 'gender') {
        currentFilters.gender = value;
        dom.genderFilters.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
      } else {
        if (value === 'all') {
          currentFilters[filterType] = [];
          tag.closest('.filter-tags').querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
          tag.classList.add('active');
        } else {
          tag.closest('.filter-tags').querySelector('[data-value="all"]').classList.remove('active');
          
          const idx = currentFilters[filterType].indexOf(value);
          if (idx > -1) {
            currentFilters[filterType].splice(idx, 1);
            tag.classList.remove('active');
          } else {
            currentFilters[filterType].push(value);
            tag.classList.add('active');
          }

          if (currentFilters[filterType].length === 0) {
            tag.closest('.filter-tags').querySelector('[data-value="all"]').classList.add('active');
          }
        }
      }

      applyFilters();
    });

    // 清除筛选
    dom.clearFilters.addEventListener('click', resetFilters);
    dom.resetBtn.addEventListener('click', resetFilters);

    // 返回按钮
    dom.backBtn.addEventListener('click', navigateToHome);

    // Logo 点击回首页
    dom.logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToHome();
    });

    // 导航按钮
    $$('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        $$('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showView(view);
      });
    });
  }

  // ---------- 视图切换 ----------
  function showView(viewName) {
    $$('.view').forEach(v => v.classList.remove('active'));
    const target = $(`#view-${viewName}`);
    if (target) {
      target.classList.add('active');
    }

    $$('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === viewName);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function navigateToHome() {
    showView('home');
  }

  // ---------- 头像生成 ----------
  function getAvatarColor(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
  }

  function renderAvatar(seiyuu, size) {
    if (seiyuu.avatar) {
      return `<img src="${seiyuu.avatar}" alt="${seiyuu.name}" onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,${getAvatarColor(seiyuu.id).join(',')})';this.parentElement.textContent='${seiyuu.name.charAt(0)}'">`;
    }
    const colors = getAvatarColor(seiyuu.id);
    const initial = seiyuu.name.replace(/（.*?）/, '').charAt(0);
    return initial;
  }

  function getAvatarStyle(id) {
    if (!id) return '';
    const colors = getAvatarColor(id);
    return `background: linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
  }

  // ---------- 筛选逻辑 ----------
  function applyFilters() {
    if (!allData) return;

    let list = [...allData.seiyuus];

    if (currentFilters.gender !== 'all') {
      list = list.filter(s => s.gender === currentFilters.gender);
    }

    if (currentFilters.voiceTypes.length > 0) {
      list = list.filter(s =>
        currentFilters.voiceTypes.some(vt => s.voiceTypes.includes(vt))
      );
    }

    if (currentFilters.tags.length > 0) {
      list = list.filter(s =>
        currentFilters.tags.some(t => s.tags.includes(t))
      );
    }

    if (currentFilters.tiers.length > 0) {
      list = list.filter(s =>
        currentFilters.tiers.includes(s.tier)
      );
    }

    if (currentFilters.search) {
      const kw = currentFilters.search.toLowerCase();
      list = list.filter(s => {
        if (s.name.toLowerCase().includes(kw)) return true;
        if (s.studio && s.studio.toLowerCase().includes(kw)) return true;
        if (s.works.some(w =>
          w.character.toLowerCase().includes(kw) ||
          w.work.toLowerCase().includes(kw)
        )) return true;
        if (s.voiceTypes.some(vt => vt.toLowerCase().includes(kw))) return true;
        if (s.tags.some(t => t.toLowerCase().includes(kw))) return true;
        return false;
      });
    }

    filteredList = list;
    renderGrid(list);
    renderSlamDunkSection();
  }

  function resetFilters() {
    currentFilters = { gender: 'all', voiceTypes: [], tags: [], tiers: [], search: '' };
    dom.searchInput.value = '';
    dom.searchClear.classList.remove('visible');

    $$('.filter-tag').forEach(t => t.classList.remove('active'));
    $$('.filter-tags').forEach(group => {
      const allBtn = group.querySelector('[data-value="all"]');
      if (allBtn) allBtn.classList.add('active');
    });

    applyFilters();
  }

  // ---------- 渲染卡片列表 ----------
  function renderGrid(list) {
    dom.resultCount.textContent = `共 ${list.length} 位声优`;

    if (list.length === 0) {
      dom.seiyuuGrid.style.display = 'none';
      dom.emptyState.style.display = 'block';
      return;
    }

    dom.seiyuuGrid.style.display = 'grid';
    dom.emptyState.style.display = 'none';

    dom.seiyuuGrid.innerHTML = list.map((s, i) => renderCard(s, i)).join('');

    requestAnimationFrame(() => {
      const cards = dom.seiyuuGrid.querySelectorAll('.seiyuu-card');
      cards.forEach((card, i) => {
        setTimeout(() => card.classList.add('visible'), i * 40);
      });
    });
  }

  function renderCard(seiyuu) {
    const genderIcon = seiyuu.gender === '男' ? '♂' : '♀';
    const genderClass = seiyuu.gender === '男' ? 'male' : 'female';
    const topWorks = seiyuu.works.slice(0, 3);
    const videoCount = seiyuu.videoSamples ? seiyuu.videoSamples.length : 0;

    const worksHtml = topWorks.map(w => `
      <div class="card-work-item">
        <span class="work-type">${getTypeLabel(w.type)}</span>
        <span><span class="char-name">${w.character}</span> · ${w.work}</span>
      </div>
    `).join('');

    const voiceHtml = seiyuu.voiceTypes.map(vt =>
      `<span class="voice-type-tag">${vt}</span>`
    ).join('');

    const videoHint = videoCount > 0
      ? `📺 ${videoCount} 个视频可试听`
      : '暂无视频样本';
    const hintClass = videoCount > 0 ? 'has-videos' : '';

    const initial = seiyuu.name.replace(/（.*?）/, '').charAt(0);

    return `
      <div class="seiyuu-card" data-id="${seiyuu.id}" onclick="window.App.showDetail('${seiyuu.id}')">
        <div class="card-header">
          <div class="card-avatar" style="${getAvatarStyle(seiyuu.id)}">${renderAvatar(seiyuu)}</div>
          <div>
            <div class="card-name">${seiyuu.name} <span class="gender-icon" style="color:var(--gender-${genderClass})">${genderIcon}</span></div>
            <div class="card-studio">${seiyuu.studio || '独立声优'}</div>
          </div>
        </div>
        <div class="card-voice-types">${voiceHtml}</div>
        <div class="card-works">${worksHtml}</div>
        <div class="card-audio-hint ${hintClass}">${videoHint}</div>
      </div>
    `;
  }

  function getTypeLabel(type) {
    const map = {
      '游戏': '游戏', '动画': '动画', '电视剧': '剧集',
      '广播剧': '广播', '电影': '电影', '综艺': '综艺'
    };
    return map[type] || type;
  }

  // ---------- 灌篮高手专题渲染 ----------
  function renderSlamDunkSection() {
    if (!allData.slamDunkMovie) {
      dom.slamdunkSection.style.display = 'none';
      return;
    }
    const isTagSelected = currentFilters.tags.includes(SLAMDUNK_TAG);
    const isSearchHit = currentFilters.search &&
      ('灌篮高手'.includes(currentFilters.search) || currentFilters.search.includes('灌篮'));

    if (!isTagSelected && !isSearchHit) {
      dom.slamdunkSection.style.display = 'none';
      return;
    }

    const movie = allData.slamDunkMovie;
    const seiyuuMap = {};
    allData.seiyuus.forEach(s => { seiyuuMap[s.id] = s; });

    const castHtml = movie.cast.map(c => {
      const inDb = c.seiyuuId && seiyuuMap[c.seiyuuId];
      const cvClass = inDb ? 'cast-cv linked' : 'cast-cv';
      const onclick = inDb ? `onclick="window.App.showDetail('${c.seiyuuId}')"` : '';
      const badge = inDb ? '<span class="cast-badge">资料库</span>' : '';
      return `
        <div class="cast-row ${inDb ? 'in-db' : ''}" ${onclick}>
          <span class="cast-character">${c.character}</span>
          <span class="cast-arrow">→</span>
          <span class="${cvClass}">${c.cv}${badge}</span>
        </div>
      `;
    }).join('');

    const dbCount = movie.cast.filter(c => c.seiyuuId && seiyuuMap[c.seiyuuId]).length;

    dom.slamdunkContent.innerHTML = `
      <div class="slamdunk-banner">
        <div class="slamdunk-header">
          <div class="slamdunk-icon">🏀</div>
          <div>
            <h2 class="slamdunk-title">${movie.title}</h2>
            <div class="slamdunk-meta">
              <span>译制：${movie.translation.studio}</span>
              <span>·</span>
              <span>配音导演：${movie.translation.director}</span>
              <span>·</span>
              <span class="slamdunk-stat">资料库已收录 ${dbCount} / ${movie.cast.length}</span>
            </div>
          </div>
        </div>
        <div class="slamdunk-cast-grid">${castHtml}</div>
        <div class="slamdunk-tip">💡 浅色行表示资料库已收录该声优，点击可跳转详情页</div>
      </div>
    `;
    dom.slamdunkSection.style.display = 'block';
  }

  // ---------- 详情页渲染 ----------
  function showDetail(seiyuuId) {
    const seiyuu = allData.seiyuus.find(s => s.id === seiyuuId);
    if (!seiyuu) return;

    const genderIcon = seiyuu.gender === '男' ? '♂' : '♀';
    const genderClass = seiyuu.gender === '男' ? 'male' : 'female';
    const genderLabel = seiyuu.gender === '男' ? '男声优' : '女声优';

    const voiceHtml = seiyuu.voiceTypes.map(vt =>
      `<span class="detail-voice-tag">${vt}</span>`
    ).join('');

    const tagsHtml = seiyuu.tags.map(t =>
      `<span class="detail-tag">${t}</span>`
    ).join('');

    // 按类型分组作品
    const workCategories = {
      '\u6e38\u620f': seiyuu.works.filter(w => w.type === '\u6e38\u620f'),
      '\u52a8\u6f2b': seiyuu.works.filter(w => w.type === '\u52a8\u753b' || w.type === '\u7535\u5f71'),
      '\u5e7f\u64ad\u5267': seiyuu.works.filter(w => w.type === '\u5e7f\u64ad\u5267'),
      '\u5176\u5b83': seiyuu.works.filter(w => w.type === '\u7535\u89c6\u5267' || !(['\u6e38\u620f','\u52a8\u753b','\u7535\u5f71','\u5e7f\u64ad\u5267'].includes(w.type)))
    };

    const tabNames = ['\u6e38\u620f', '\u52a8\u6f2b', '\u5e7f\u64ad\u5267', '\u5176\u5b83'];
    const firstNonEmpty = tabNames.find(t => workCategories[t].length > 0) || '\u6e38\u620f';

    const tabsHtml = tabNames.map(t => {
      const count = workCategories[t].length;
      const activeClass = t === firstNonEmpty ? 'active' : '';
      return `<button class="works-tab ${activeClass}" data-tab="${t}" ${count === 0 ? 'disabled' : ''}>${t}${count > 0 ? ' (' + count + ')' : ''}</button>`;
    }).join('');

    const tabContentsHtml = tabNames.map(t => {
      const activeClass = t === firstNonEmpty ? 'active' : '';
      const items = workCategories[t].map(w => `
        <div class="work-card">
          <span class="work-type-badge ${getWorkTypeClass(w.type)}">${getTypeLabel(w.type)}</span>
          <div class="work-info">
            <div class="work-char">${w.character}</div>
            <div class="work-name">${w.work}</div>
          </div>
        </div>
      `).join('') || '<div class="works-empty">\u6682\u65e0\u6b64\u7c7b\u4f5c\u54c1</div>';
      return `<div class="works-tab-content ${activeClass}" data-tab="${t}">${items}</div>`;
    }).join('');

    const videoHtml = renderVideoSection(seiyuu);

    // B站空间链接
    let bilibiliLinkHtml = '';
    if (seiyuu.bilibiliSpace) {
      bilibiliLinkHtml = `
        <a class="bilibili-link" href="https://space.bilibili.com/${seiyuu.bilibiliSpace}" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 1024 1024"><path d="M174.7 319.4c-16.3 2.7-32.5 8.3-48 16.7-37 20-63.1 57.3-72.3 100.1L18.6 606.2c-5.7 26.3-6.3 53.7-1.7 80.2 6.3 37 22.3 70.3 46.3 96.7 24 26.3 55.3 44.7 90 53.3 16.3 4 33 6 49.7 5.7h160c57 0 113.7-16.7 162-48.3 48.3-31.3 85.7-76 107.3-128.3l30.7-75.3c17-41.7 47.3-76 87-97.3 39.3-21.3 84-30 128.3-24.7l120 16c57 7.7 115-8.3 160-44.7 45-36.3 71.3-90 71.3-147V203.3c0-32.3-12.7-63-35-85.7-22.7-22.7-53.3-35.3-85.7-35.3H704c-106.7 0-211 28.7-302.7 83L301.3 239c-20 12-43 18-66.3 17.3l-60-2z"/></svg>
          访问B站空间
        </a>
      `;
    }

    dom.detailContent.innerHTML = `
      <div class="detail-hero">
        <div class="detail-avatar" style="${getAvatarStyle(seiyuu.id)}">${renderAvatar(seiyuu)}</div>
        <div class="detail-info">
          <h1 class="detail-name">
            ${seiyuu.name}
            <span class="detail-gender-badge ${genderClass}">${genderLabel}</span>
          </h1>
          <div class="detail-studio">${seiyuu.studio ? '📍 ' + seiyuu.studio : '独立声优'}</div>
          <p class="detail-bio">${seiyuu.bio}</p>
          <div class="detail-tags">${tagsHtml}</div>
          <div class="detail-voice-types">${voiceHtml}</div>
        </div>
      </div>

      <div class="detail-section">
        <h2 class="detail-section-title">🎬 代表作品</h2>
        <div class="works-tabs">${tabsHtml}</div>
        <div class="works-tab-panels">${tabContentsHtml}</div>
      </div>

      <div class="detail-section">
        <h2 class="detail-section-title">📺 语音试听</h2>
        <div class="video-section">${videoHtml}</div>
        ${bilibiliLinkHtml}
      </div>
    `;

    showView('detail');

    // 绑定作品页签切换
    dom.detailContent.querySelectorAll('.works-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        if (tab.disabled) return;
        dom.detailContent.querySelectorAll('.works-tab').forEach(t => t.classList.remove('active'));
        dom.detailContent.querySelectorAll('.works-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        dom.detailContent.querySelector(`.works-tab-content[data-tab="${tab.dataset.tab}"]`).classList.add('active');
      });
    });

    window.scrollTo({ top: 0 });
  }

  function getWorkTypeClass(type) {
    const map = {
      '游戏': 'game', '动画': 'anime', '电视剧': 'tv',
      '广播剧': 'drama', '电影': 'tv', '综艺': 'drama'
    };
    return map[type] || 'game';
  }

  // ---------- B站视频嵌入 ----------
  function renderVideoSection(seiyuu) {
    if (!seiyuu.videoSamples || seiyuu.videoSamples.length === 0) {
      return `<div class="video-placeholder-msg">暂无视频样本，敬请期待</div>`;
    }

    return seiyuu.videoSamples.map(sample => {
      const bvid = sample.bvid;
      const embedUrl = `https://player.bilibili.com/player.html?bvid=${bvid}&high_quality=1&danmaku=0`;
      const pageUrl = `https://www.bilibili.com/video/${bvid}`;

      return `
        <div class="video-item">
          <div class="video-item-header">
            <div>
              <div class="video-item-title">${sample.title}</div>
              <div class="video-item-desc">${sample.desc}</div>
            </div>
            <span class="video-item-category">${sample.category}</span>
          </div>
          <div class="video-embed-container">
            <iframe 
              src="${embedUrl}" 
              scrolling="no" 
              allowfullscreen="true"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              loading="lazy"
            ></iframe>
          </div>
        </div>
      `;
    }).join('');
  }

  // ---------- 工具函数 ----------
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ---------- 暴露给 HTML onclick 的接口 ----------
  window.App = {
    showDetail
  };

  // ---------- 启动 ----------
  document.addEventListener('DOMContentLoaded', init);
})();