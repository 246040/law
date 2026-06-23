/**
 * 法考通 · 应用入口
 * 负责数据加载、路由、导航初始化
 */
import { Store } from './state.js';
import { $, $$, on } from './utils/dom.js';
import { loadJSON } from './utils/helpers.js';

import dashboard from './pages/dashboard.js';
import practice from './pages/practice.js';
import flashcards from './pages/flashcards.js';
import mistakes from './pages/mistakes.js';
import knowledge from './pages/knowledge.js';
import laws from './pages/laws.js';
import settings from './pages/settings.js';

// ---- 路由表 ----
const pages = { dashboard, practice, flashcards, mistakes, knowledge, laws, settings };
const pageTitles = {
  dashboard: '学习面板',
  practice: '刷题练习',
  flashcards: '速记卡片',
  mistakes: '错题本',
  knowledge: '知识体系',
  laws: '重点法条',
  settings: '考试设置',
};

// ---- 全局状态 ----
const store = new Store('fakao_data');
let currentPage = 'dashboard';
let appData = { subjects: [], questions: [], flashcards: [], knowledge: {}, laws: [] };

// ---- 初始化 ----
async function init() {
  try {
    // 加载数据
    const [subjectsData, flashcardsData, knowledgeData, lawsData] = await Promise.all([
      loadJSON('./data/subjects.json'),
      loadJSON('./data/flashcards.json'),
      loadJSON('./data/knowledge.json'),
      loadJSON('./data/laws.json'),
    ]);

    appData.subjects = subjectsData || [];
    appData.flashcards = flashcardsData || [];
    appData.knowledge = knowledgeData || {};
    appData.laws = lawsData || [];

    // 加载所有题目（按学科文件）
    const subjectIds = appData.subjects.map(s => s.id);
    const questionPromises = subjectIds.map(id => loadJSON(`./data/questions/${id}.json`));
    const questionResults = await Promise.all(questionPromises);
    appData.questions = questionResults.flat().filter(Boolean);

    // 数据加载失败检查
    if (appData.subjects.length === 0) {
      throw new Error('subjects.json 加载为空');
    }

    // 绑定导航
    bindNavigation();

    // 渲染初始页面
    switchPage('dashboard');
  } catch (err) {
    console.error('[法考通] 数据加载失败:', err);
    const container = $('#pageContent');
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="margin-top:80px;">
          <div class="empty-state-icon" style="color:var(--accent-red);">&#9888;</div>
          <h3>数据加载失败</h3>
          <p style="max-width:400px;margin:12px auto;line-height:1.8;">
            如果你是直接打开 HTML 文件，请改用 HTTP 服务器访问：<br>
            <code style="background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:4px;">npx serve .</code><br>
            或直接访问在线版：<br>
            <a href="https://246040.github.io/law/" style="color:var(--accent-gold);">https://246040.github.io/law/</a>
          </p>
        </div>`;
    }
  }
}

// ---- 导航 ----
function bindNavigation() {
  // 侧边栏导航项
  on(document.body, 'click', '.nav-item[data-page]', (e, el) => {
    switchPage(el.dataset.page);
  });

  // 快速操作导航
  on(document.body, 'click', '[data-nav]', (e, el) => {
    switchPage(el.dataset.nav);
  });

  // 移动端菜单按钮
  $('#menuToggle')?.addEventListener('click', () => {
    $('#sidebar')?.classList.toggle('open');
  });
}

function switchPage(page) {
  if (!pages[page]) return;
  currentPage = page;

  // 更新侧边栏高亮
  $$('.nav-item').forEach(n => n.classList.remove('active'));
  $(`.nav-item[data-page="${page}"]`)?.classList.add('active');

  // 更新标题
  const titleEl = $('#pageTitle');
  if (titleEl) titleEl.textContent = pageTitles[page] || '';

  // 关闭移动端侧边栏
  $('#sidebar')?.classList.remove('open');

  // 获取容器并渲染页面
  const container = $('#pageContent');
  if (!container) return;

  // 销毁当前页面
  // （如果之前的页面有 destroy 方法）

  // 初始化新页面
  pages[page].init(container, store, appData);
}

// 暴露全局方法供 HTML 内联事件使用（向后兼容）
window.switchPage = switchPage;

// ---- 启动 ----
init();
