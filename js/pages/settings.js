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
      </div>

      <div class="card" style="max-width:600px;margin-top:20px;">
        <div class="card-title">题库管理</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px;">
          <div class="stat-card" style="padding:12px;text-align:center;">
            <div style="font-size:1.3rem;font-weight:700;color:var(--accent-gold);">${questions.length}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);">题目总数</div>
          </div>
          <div class="stat-card" style="padding:12px;text-align:center;">
            <div style="font-size:1.3rem;font-weight:700;color:var(--accent-blue);">${questions.filter(q => q.type === 'single' || (!q.type && !Array.isArray(q.answer))).length}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);">单选题</div>
          </div>
          <div class="stat-card" style="padding:12px;text-align:center;">
            <div style="font-size:1.3rem;font-weight:700;color:var(--accent-purple);">${questions.filter(q => q.type === 'multiple' || q.type === 'uncertain').length}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);">多选/不定项</div>
          </div>
          <div class="stat-card" style="padding:12px;text-align:center;">
            <div style="font-size:1.3rem;font-weight:700;color:var(--accent-green);">${flashcards.length}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);">速记卡片</div>
          </div>
        </div>
        <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:12px;">
          支持导入自定义题库 JSON（格式：数组，每项包含 id, stem, options, answer, subject 字段）
        </p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" id="btnImportQuestions">📥 导入题库</button>
          <button class="btn btn-ghost btn-sm" id="btnExportQuestions">📤 导出题库</button>
        </div>
        <input type="file" id="importQuestionsFile" accept=".json" style="display:none">
        <div id="importResult" style="margin-top:12px;"></div>
      </div>

      <div class="card" style="max-width:600px;margin-top:20px;">
        <div class="card-title">数据管理</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" id="btnExport">💾 导出学习数据</button>
          <button class="btn btn-ghost btn-sm" id="btnImportTrigger">📂 导入学习数据</button>
          <button class="btn btn-ghost btn-sm" id="btnReset" style="color:var(--accent-red);border-color:rgba(239,68,68,0.3);">🗑 重置所有数据</button>
        </div>
        <input type="file" id="importFile" accept=".json" style="display:none">
      </div>

      <div class="card" style="max-width:600px;margin-top:20px;">
        <div class="card-title">每日学习计划</div>
        <p style="font-size:0.84rem;color:var(--text-secondary);line-height:1.7;">
          基于距离考试的剩余天数和目标分数，建议你每天完成以下学习量：
        </p>
        <div id="studyPlan" style="margin-top:16px;"></div>
      </div>`;

    this._renderStudyPlan();
    this._bindEvents();
  },

  destroy() {},

  _bindEvents() {
    // Save settings
    $('#btnSaveSettings', container)?.addEventListener('click', () => {
      const examDate = $('#examDateInput', container).value;
      const dailyGoal = parseInt($('#dailyGoalInput', container).value) || 30;
      const targetScore = parseInt($('#targetScoreInput', container).value) || 180;
      store.set('settings', { examDate, dailyGoal, targetScore });
      this._renderStudyPlan();
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

    // Export questions
    $('#btnExportQuestions', container)?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fakao_questions_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Import questions
    $('#btnImportQuestions', container)?.addEventListener('click', () => {
      $('#importQuestionsFile', container)?.click();
    });

    $('#importQuestionsFile', container)?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const resultEl = $('#importResult', container);
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (!Array.isArray(imported)) throw new Error('格式错误：需要数组');

          // 验证必要字段
          const valid = imported.filter(q =>
            q.id && q.stem && q.options && q.answer !== undefined
          );
          const invalid = imported.length - valid.length;

          // 合并到题库（去重）
          const existingIds = new Set(questions.map(q => q.id));
          const newQs = valid.filter(q => !existingIds.has(q.id));
          questions.push(...newQs);

          // 将导入的题目存储到 localStorage
          try {
            const customQs = JSON.parse(localStorage.getItem('fakao_custom_questions') || '[]');
            customQs.push(...newQs);
            localStorage.setItem('fakao_custom_questions', JSON.stringify(customQs));
          } catch (e) { /* localStorage full */ }

          resultEl.innerHTML = `
            <div style="padding:12px;border-radius:8px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);font-size:0.82rem;">
              ✅ 导入成功！新增 <strong>${newQs.length}</strong> 题${invalid > 0 ? `，跳过 ${invalid} 条无效数据` : ''}${newQs.length < valid.length ? `，${valid.length - newQs.length} 题已存在` : ''}
            </div>`;
          this.render();
        } catch (err) {
          resultEl.innerHTML = `
            <div style="padding:12px;border-radius:8px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);font-size:0.82rem;">
              ❌ 导入失败：${err.message}
            </div>`;
        }
      };
      reader.readAsText(file);
    });

    // Reset all data
    $('#btnReset', container)?.addEventListener('click', () => {
      if (!confirm('确定要重置所有学习数据吗？此操作不可逆！\n\n将清除：刷题记录、错题本、连续天数、模考历史等所有进度数据。\n题库数据不受影响。')) return;
      if (!confirm('再次确认：真的要清除所有学习进度吗？')) return;
      store.reset();
      alert('所有学习数据已重置。');
      this.render();
    });
  },

  _renderStudyPlan() {
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
