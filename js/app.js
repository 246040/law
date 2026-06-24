/**
 * 法考通 · 应用入口
 * 负责数据加载、路由、导航初始化
 */
import { Store } from './state.js';
import { $, $$, on } from './utils/dom.js';
import { loadJSON } from './utils/helpers.js';
import { initKeyboard, setContext } from './utils/keyboard.js';

import dashboard from './pages/dashboard.js';
import practice from './pages/practice.js';
import flashcards from './pages/flashcards.js';
import mistakes from './pages/mistakes.js';
import knowledge from './pages/knowledge.js';
import laws from './pages/laws.js';
import settings from './pages/settings.js';
import exam from './pages/exam.js';

// ---- 路由表 ----
const pages = { dashboard, practice, flashcards, mistakes, knowledge, laws, exam, settings };
const pageTitles = {
  dashboard: '学习面板',
  practice: '刷题练习',
  exam: '模拟考试',
  flashcards: '速记卡片',
  mistakes: '错题本',
  knowledge: '知识体系',
  laws: '重点法条',
  settings: '考试设置',
};

// ---- 数据标准化 ----
const ANSWER_MAP = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 };

function normalizeQuestion(q) {
  // answer: 支持多种格式
  // 单选: "A" → 0, 0 → 0
  // 多选: ["A","C"] → [0,2], [0,2] → [0,2], "AC" → [0,2]
  if (Array.isArray(q.answer)) {
    // 数组格式：统一转为数字数组
    q.answer = q.answer.map(a =>
      typeof a === 'string' ? (ANSWER_MAP[a.toUpperCase()] ?? 0) : a
    ).sort((a, b) => a - b);
  } else if (typeof q.answer === 'string') {
    if (q.answer.length > 1 && !ANSWER_MAP.hasOwnProperty(q.answer)) {
      // 多字母拼接格式 "AC" → [0, 2]
      q.answer = q.answer.split('').map(c => ANSWER_MAP[c.toUpperCase()] ?? 0).sort((a, b) => a - b);
    } else {
      // 单字母格式 "A" → 0
      q.answer = ANSWER_MAP[q.answer.toUpperCase()] ?? 0;
    }
  }

  // type: 确保 type 字段正确
  if (!q.type) {
    q.type = Array.isArray(q.answer) ? 'multiple' : 'single';
  }

  // explanation: 兼容 analysis 字段
  if (!q.explanation && q.analysis) {
    q.explanation = q.analysis;
  }
  return q;
}

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

    // 加载所有题目（支持单文件和分册文件）
    const subjectIds = appData.subjects.map(s => s.id);
    const questionFiles = [];
    for (const id of subjectIds) {
      if (id === 'xs' || id === 'mg') {
        // 刑法和民法有6册
        for (let i = 1; i <= 6; i++) questionFiles.push(`./data/questions/${id}_${i}.json`);
      } else {
        // 其他学科：基础文件 + 扩展卷
        questionFiles.push(`./data/questions/${id}.json`);
        questionFiles.push(`./data/questions/${id}_2.json`);
      }
    }
    const questionResults = await Promise.all(questionFiles.map(f => loadJSON(f).catch(() => [])));
    // 加载多选题/不定项选择题
    const multiData = await loadJSON('./data/questions/multi_sample.json').catch(() => []);
    // 加载AI生成题库
    const genFiles = ['xs_gen_1', 'xs_gen_2', 'mg_gen_1', 'mg_gen_2', 'ms_gen_1', 'ms_gen_2', 'ss_gen_1', 'ss_gen_2', 'xz_gen_1', 'sg_gen_1', 'xf_gen_1', 'fx_gen_1', 'gj_gen_1'];
    const genResults = await Promise.all(genFiles.map(f => loadJSON(`./data/questions/${f}.json`).catch(() => [])));
    appData.questions = [...questionResults.flat().filter(Boolean), ...(multiData || []), ...genResults.flat().filter(Boolean)].map(normalizeQuestion);

    // 数据加载失败检查
    if (appData.subjects.length === 0) {
      throw new Error('subjects.json 加载为空');
    }

    // 绑定导航
    bindNavigation();

    // 初始化键盘快捷键
    initKeyboard();

    // 渲染初始页面（优先从 URL hash 恢复）
    const initialPage = getPageFromHash() || 'dashboard';
    switchPage(initialPage);
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
    const sidebar = $('#sidebar');
    sidebar?.classList.toggle('open');
  });

  // 点击遮罩关闭侧边栏
  $('#sidebarOverlay')?.addEventListener('click', () => {
    $('#sidebar')?.classList.remove('open');
  });

  // Hash 路由监听
  window.addEventListener('hashchange', () => {
    const page = getPageFromHash();
    if (page && page !== currentPage) {
      switchPage(page, false); // false = 不再更新 hash（避免循环）
    }
  });
}

/**
 * 从 URL hash 解析当前页面
 * 格式: #/pageName
 */
function getPageFromHash() {
  const hash = window.location.hash;
  if (!hash || hash.length < 3) return null;
  const page = hash.replace(/^#\/?/, '').split('?')[0];
  return pages[page] ? page : null;
}

function switchPage(page, updateHash = true) {
  if (!pages[page]) return;
  currentPage = page;

  // 更新 URL hash
  if (updateHash) {
    window.location.hash = `#/${page}`;
  }

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

  // 更新键盘快捷键上下文
  setContext(page);
}

// 暴露全局方法供 HTML 内联事件使用（向后兼容）
window.switchPage = switchPage;

// ---- 启动 ----
init();
