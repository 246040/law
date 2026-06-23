/**
 * 法考通 · 考试设置页面
 */
import { $ } from '../utils/dom.js';
import { daysUntil } from '../utils/helpers.js';

let store, questions, flashcards, container;

export default {
  init(_container, _store, data) {
    store = _store;
    questions = data.questions;
    flashcards = data.flashcards;
    container = _container;
    this.render();
  },

  render() {
    const settings = store.get('settings') || {};
    const mistakes = store.get('mistakes') || [];

    container.innerHTML = `
      <div class="card" style="max-width:600px;">
        <div class="card-title">考试设置</div>
        <div class="form-group">
          <label class="form-label">客观题考试日期</label>
          <input type="date" class="form-input" id="examDateInput" value="${settings.examDate || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">每日目标刷题数</label>
          <input type="number" class="form-input" id="dailyGoalInput" min="5" max="200" value="${settings.dailyGoal || 30}">
        </div>
        <div class="form-group">
          <label class="form-label">目标分数</label>
          <input type="number" class="form-input" id="targetScoreInput" min="100" max="300" value="${settings.targetScore || 180}" placeholder="客观题满分300，一般180合格">
        </div>
        <button class="btn btn-primary" id="btnSaveSettings">保存设置</button>
        <button class="btn btn-ghost" style="margin-left:10px;" id="btnExport">导出数据</button>
        <button class="btn btn-ghost" style="margin-left:10px;" id="btnImportTrigger">导入数据</button>
        <input type="file" id="importFile" accept=".json" style="display:none">
      </div>

      <div class="card" style="max-width:600px;margin-top:20px;">
        <div class="card-title">每日学习计划</div>
        <p style="font-size:0.84rem;color:var(--text-secondary);line-height:1.7;">
          基于距离考试的剩余天数和目标分数，建议你每天完成以下学习量：
        </p>
        <div id="studyPlan" style="margin-top:16px;"></div>
      </div>`;

    this.#renderStudyPlan();
    this.#bindEvents();
  },

  destroy() {},

  #bindEvents() {
    // Save settings
    $('#btnSaveSettings', container)?.addEventListener('click', () => {
      const examDate = $('#examDateInput', container).value;
      const dailyGoal = parseInt($('#dailyGoalInput', container).value) || 30;
      const targetScore = parseInt($('#targetScoreInput', container).value) || 180;
      store.set('settings', { examDate, dailyGoal, targetScore });
      this.#renderStudyPlan();
      alert('设置已保存！');
    });

    // Export
    $('#btnExport', container)?.addEventListener('click', () => {
      const data = store.export();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fakao_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Import
    $('#btnImportTrigger', container)?.addEventListener('click', () => {
      $('#importFile', container)?.click();
    });

    $('#importFile', container)?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          store.import(ev.target.result);
          alert('数据导入成功！');
          this.render();
        } catch (err) {
          alert('导入失败：文件格式不正确');
        }
      };
      reader.readAsText(file);
    });
  },

  #renderStudyPlan() {
    const planEl = $('#studyPlan', container);
    if (!planEl) return;

    const settings = store.get('settings') || {};
    const examDate = settings.examDate;
    const mistakes = store.get('mistakes') || [];

    if (!examDate) {
      planEl.innerHTML = `<p style="color:var(--text-muted);font-size:0.84rem;">请先设置考试日期以生成学习计划。</p>`;
      return;
    }

    const daysLeft = Math.max(1, daysUntil(examDate));
    const dailyQ = settings.dailyGoal || 30;
    const totalFlashcards = flashcards.length;
    const dailyCards = Math.ceil(totalFlashcards / Math.min(daysLeft, 30));
    const remainingMistakes = mistakes.length;
    const dailyMistakes = Math.ceil(remainingMistakes / Math.min(daysLeft, 14));

    planEl.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:12px;">
        <div class="stat-card" style="padding:16px;">
          <div class="stat-label" style="font-size:0.7rem;">每日刷题</div>
          <div style="font-family:var(--font-serif);font-size:1.5rem;font-weight:900;color:var(--accent-gold);">${dailyQ} 题</div>
          <div class="stat-sub">${daysLeft} 天 × ${dailyQ} 题 = ${daysLeft * dailyQ} 题</div>
        </div>
        <div class="stat-card" style="padding:16px;">
          <div class="stat-label" style="font-size:0.7rem;">每日卡片</div>
          <div style="font-family:var(--font-serif);font-size:1.5rem;font-weight:900;color:var(--accent-purple);">${dailyCards} 张</div>
          <div class="stat-sub">共 ${totalFlashcards} 张速记卡</div>
        </div>
        <div class="stat-card" style="padding:16px;">
          <div class="stat-label" style="font-size:0.7rem;">每日错题</div>
          <div style="font-family:var(--font-serif);font-size:1.5rem;font-weight:900;color:var(--accent-red);">${dailyMistakes} 题</div>
          <div class="stat-sub">待复习 ${remainingMistakes} 题</div>
        </div>
      </div>`;
  }
};
