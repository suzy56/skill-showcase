'use strict';

const text = {
  en: {
    skip: 'Skip to skills', eyebrow: 'A PERSONAL COLLECTION', subtitle: 'AI agent skills I use locally',
    updated: 'Updated', collection: 'The collection', searchLabel: 'Search skills',
    searchPlaceholder: 'Search name or description…', all: 'All', skills: 'skills',
    loading: 'Loading skills…', emptyTitle: 'No skills found', emptyBody: 'Try another keyword or category.',
    reset: 'Clear filters', errorTitle: 'The shelf could not be loaded',
    errorBody: 'Please refresh to try again. If previewing locally, serve this folder with python3 -m http.server.',
    footer: 'Built from local skill metadata. Descriptions belong to their authors.',
    more: 'More', less: 'Less', missing: 'Source not recorded', family: 'family',
    categories: 'Skill categories', browse: 'Browse skills', dark: 'Dark', light: 'Light',
    themeDark: 'Switch to dark theme', themeLight: 'Switch to light theme', language: '切换到中文',
    results: (count, total) => `Showing ${count} of ${total} skills`,
  },
  zh: {
    skip: '跳至技能列表', eyebrow: '我的本地技能收藏', subtitle: '我在本地使用的 AI Agent Skills',
    updated: '更新于', collection: '技能收藏', searchLabel: '搜索技能',
    searchPlaceholder: '搜索名称或描述…', all: '全部', skills: '个技能',
    loading: '正在加载技能…', emptyTitle: '没有找到技能', emptyBody: '试试其他关键词或分类。',
    reset: '清除筛选', errorTitle: '技能列表加载失败',
    errorBody: '请刷新页面重试。本地预览时，请在此目录运行 python3 -m http.server。',
    footer: '基于本地技能元数据构建。描述版权归各自作者所有。',
    more: '展开', less: '收起', missing: '来源未记录', family: '系列',
    categories: '技能分类', browse: '浏览技能', dark: '深色', light: '浅色',
    themeDark: '切换到深色主题', themeLight: '切换到浅色主题', language: 'Switch to English',
    results: (count, total) => `显示 ${count} / ${total} 个技能`,
  },
};

function stored(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function remember(key, value) {
  try { localStorage.setItem(key, value); } catch { /* Preferences are optional. */ }
}

const savedLanguage = stored('skill-shelf-language');
let language = ['zh', 'en'].includes(savedLanguage) ? savedLanguage : (navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en');
const savedTheme = stored('skill-shelf-theme');
let theme = ['light', 'dark'].includes(savedTheme) ? savedTheme : null;
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let data = null;
let failed = false;
let selectedCategory = null;
const expanded = new Set();
const grid = document.querySelector('#skills-grid');
const panel = document.querySelector('#skills-panel');
const tabs = document.querySelector('#category-tabs');
const search = document.querySelector('#search');
const status = document.querySelector('#results-status');
const t = () => text[language];

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

function applyTheme() {
  if (theme) document.documentElement.dataset.theme = theme;
  const dark = (theme || (systemTheme.matches ? 'dark' : 'light')) === 'dark';
  document.querySelector('#theme-label').textContent = dark ? t().light : t().dark;
  document.querySelector('#theme-toggle').setAttribute('aria-label', dark ? t().themeLight : t().themeDark);
  document.querySelector('meta[name="theme-color"]').content = dark ? '#171c19' : '#f6f5f0';
}

function applyLanguage() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t()[node.dataset.i18n]; });
  search.placeholder = t().searchPlaceholder;
  tabs.setAttribute('aria-label', t().categories);
  document.querySelector('#browse-controls').setAttribute('aria-label', t().browse);
  document.querySelector('#language-toggle').setAttribute('aria-label', t().language);
  applyTheme();
  if (data) {
    document.querySelector('#skill-count').textContent = `${data.skills.length} ${t().skills}`;
    renderTabs();
    renderSkills();
  } else {
    status.textContent = failed ? '' : t().loading;
  }
}

function renderTabs() {
  const categories = [{ id: null, label: t().all, count: data.skills.length }, ...data.categories.map(category => ({
    id: category.id,
    label: category[language],
    count: data.skills.filter(skill => skill.category === category.id).length,
  }))];
  tabs.replaceChildren(...categories.map((category, index) => {
    const button = element('button', '', category.label);
    button.type = 'button';
    button.id = `category-${index}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'skills-panel');
    button.setAttribute('aria-selected', String(category.id === selectedCategory));
    button.tabIndex = category.id === selectedCategory ? 0 : -1;
    button.append(element('span', 'tab-count', String(category.count)));
    button.addEventListener('click', () => {
      selectedCategory = category.id;
      for (const tab of tabs.children) {
        const active = tab === button;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      }
      renderSkills();
    });
    return button;
  }));
}

tabs.addEventListener('keydown', event => {
  const buttons = Array.from(tabs.children);
  const current = buttons.indexOf(document.activeElement);
  if (current < 0) return;
  let next;
  if (event.key === 'ArrowRight') next = (current + 1) % buttons.length;
  if (event.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = buttons.length - 1;
  if (next === undefined) return;
  event.preventDefault();
  buttons[next].focus();
  buttons[next].click();
});

function prefix(name) {
  const hyphen = name.indexOf('-');
  return hyphen > 0 ? name.slice(0, hyphen) : null;
}

function makeCard(skill) {
  const index = data.skills.indexOf(skill);
  const card = element('article', 'skill-card');
  const top = element('div', 'card-topline');
  const category = data.categories.find(item => item.id === skill.category);
  top.append(element('span', 'category-chip', category ? category[language] : skill.category), element('span', 'card-number', String(index + 1).padStart(2, '0')));
  const title = element('h3', '', skill.name);
  const description = element('p', 'description', skill.description);
  description.id = `description-${index}`;
  const isExpanded = expanded.has(skill.name);
  description.classList.toggle('is-clamped', !isExpanded);
  const more = element('button', 'more-button', isExpanded ? t().less : t().more);
  more.type = 'button';
  more.hidden = !isExpanded;
  more.setAttribute('aria-expanded', String(isExpanded));
  more.setAttribute('aria-controls', description.id);
  more.setAttribute('aria-label', `${more.textContent}: ${skill.name}`);
  more.addEventListener('click', () => {
    const open = !expanded.has(skill.name);
    if (open) expanded.add(skill.name); else expanded.delete(skill.name);
    description.classList.toggle('is-clamped', !open);
    more.textContent = open ? t().less : t().more;
    more.setAttribute('aria-expanded', String(open));
    more.setAttribute('aria-label', `${more.textContent}: ${skill.name}`);
  });
  const source = element('div', 'card-source');
  if (skill.source.url) {
    const link = element('a', '', skill.source.label);
    link.href = skill.source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const arrow = element('span', '', ' ↗');
    arrow.setAttribute('aria-hidden', 'true');
    link.append(arrow);
    source.append(link);
  } else {
    source.append(element('span', 'source-missing', t().missing));
  }
  card.append(top, title, description, more, source);
  return card;
}

function updateOverflow() {
  grid.querySelectorAll('.skill-card').forEach(card => {
    const description = card.querySelector('.description');
    const button = card.querySelector('.more-button');
    button.hidden = button.getAttribute('aria-expanded') !== 'true' && description.scrollHeight <= description.clientHeight + 1;
  });
}

function renderSkills() {
  const query = search.value.trim().toLocaleLowerCase();
  const visible = data.skills.filter(skill => (selectedCategory === null || skill.category === selectedCategory)
    && `${skill.name}\n${skill.description}`.toLocaleLowerCase().includes(query));
  const familyCounts = new Map();
  for (const skill of data.skills) {
    const family = prefix(skill.name);
    if (family) familyCounts.set(family, (familyCounts.get(family) || 0) + 1);
  }
  const standalone = [];
  const families = new Map();
  for (const skill of visible) {
    const family = prefix(skill.name);
    if (family && familyCounts.get(family) >= 3) {
      if (!families.has(family)) families.set(family, []);
      families.get(family).push(skill);
    } else standalone.push(skill);
  }
  const fragment = document.createDocumentFragment();
  for (const skill of standalone) fragment.append(makeCard(skill));
  for (const [family, skills] of families) {
    const label = element('h2', 'family-label');
    label.append(element('code', '', `${family}-*`), document.createTextNode(`${t().family} · ${skills.length}`));
    fragment.append(label, ...skills.map(makeCard));
  }
  grid.replaceChildren(fragment);
  panel.setAttribute('aria-labelledby', tabs.querySelector('[aria-selected="true"]').id);
  document.querySelector('#empty-state').hidden = visible.length !== 0;
  status.textContent = t().results(visible.length, data.skills.length);
  requestAnimationFrame(updateOverflow);
}

search.addEventListener('input', () => { if (data) renderSkills(); });
document.querySelector('#reset-filters').addEventListener('click', () => {
  search.value = '';
  selectedCategory = null;
  renderTabs();
  renderSkills();
  search.focus();
});
document.querySelector('#language-toggle').addEventListener('click', () => {
  language = language === 'zh' ? 'en' : 'zh';
  remember('skill-shelf-language', language);
  applyLanguage();
});
document.querySelector('#theme-toggle').addEventListener('click', () => {
  const current = theme || (systemTheme.matches ? 'dark' : 'light');
  theme = current === 'dark' ? 'light' : 'dark';
  remember('skill-shelf-theme', theme);
  applyTheme();
});
systemTheme.addEventListener('change', applyTheme);
new ResizeObserver(updateOverflow).observe(grid);
applyLanguage();

async function loadSkills() {
  try {
    const response = await fetch('data/skills.json');
    if (!response.ok) throw new Error(`Metadata request failed: ${response.status}`);
    data = await response.json();
    const date = document.querySelector('#generated-date');
    date.textContent = data.generatedAt;
    date.dateTime = data.generatedAt;
    applyLanguage();
  } catch {
    data = null;
    failed = true;
    status.textContent = '';
    document.querySelector('#error-state').hidden = false;
  } finally {
    panel.setAttribute('aria-busy', 'false');
  }
}
loadSkills();
