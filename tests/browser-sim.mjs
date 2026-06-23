/**
 * 模拟浏览器环境测试 app 加载流程
 */
import { JSDOM } from 'jsdom';

// 创建模拟 DOM
const dom = new JSDOM(`
<!DOCTYPE html>
<html><body>
<div class="app-container">
  <aside class="sidebar" id="sidebar">
    <nav class="sidebar-nav">
      <div class="nav-item active" data-page="dashboard"><span class="nav-text">学习面板</span></div>
      <div class="nav-item" data-page="practice"><span class="nav-text">刷题练习</span></div>
    </nav>
  </aside>
  <main class="main-content">
    <button class="menu-toggle" id="menuToggle">☰</button>
    <h1 class="page-title" id="pageTitle">学习面板</h1>
    <div class="page-content" id="pageContent">Loading...</div>
  </main>
</div>
</body></html>`, { url: 'http://localhost:4567/', pretendToBeVisual: true });

global.document = dom.window.document;
global.window = dom.window;
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] ?? null; },
  setItem(k, v) { this._data[k] = v; },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};
global.fetch = async (url) => {
  const fs = await import('fs');
  const path = await import('path');
  const filePath = path.default.join('D:/law', url.replace('./', '/'));
  try {
    const content = fs.default.readFileSync(filePath, 'utf-8');
    return { ok: true, status: 200, json: async () => JSON.parse(content) };
  } catch (e) {
    console.error('FETCH FAIL:', url, e.message);
    return { ok: false, status: 404 };
  }
};
global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));

// 加载核心模块
try {
  const { Store } = await import('../js/state.js');
  console.log('✓ state.js loaded');

  const { loadJSON } = await import('../js/utils/helpers.js');
  console.log('✓ helpers.js loaded');

  const { $, on } = await import('../js/utils/dom.js');
  console.log('✓ dom.js loaded');

  const dashboard = (await import('../js/pages/dashboard.js')).default;
  console.log('✓ dashboard.js loaded');

  // 模拟 init 流程
  const store = new Store('test');
  console.log('✓ Store created');

  const subjects = await loadJSON('./data/subjects.json');
  console.log('✓ subjects loaded:', subjects.length);

  const subjectIds = subjects.map(s => s.id);
  const questionResults = await Promise.all(subjectIds.map(id => loadJSON(`./data/questions/${id}.json`)));
  const questions = questionResults.flat().filter(Boolean);
  console.log('✓ questions loaded:', questions.length);

  const flashcards = await loadJSON('./data/flashcards.json');
  const knowledge = await loadJSON('./data/knowledge.json');
  const laws = await loadJSON('./data/laws.json');
  console.log('✓ all data loaded');

  const container = document.querySelector('#pageContent');
  const appData = { subjects, questions, flashcards, knowledge, laws };

  dashboard.init(container, store, appData);
  console.log('✓ dashboard.init() completed');
  console.log('✓ pageContent length:', container.innerHTML.length, 'chars');

} catch (e) {
  console.error('✗ ERROR:', e.message);
  console.error(e.stack);
}
