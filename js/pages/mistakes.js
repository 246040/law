/**
 * 法考通 · 错题本页面
 */
import { $ } from '../utils/dom.js';
import { MARKERS, formatDateCN } from '../utils/helpers.js';

let store, subjects, questions, container;
let filter = 'all';

export default {
  init(_container, _store, data) {
    store = _store;
    subjects = data.subjects;
    questions = data.questions;
    container = _container;
    filter = 'all';
    this.render();
  },

  render() {
    const mistakes = store.get('mistakes') || [];

    let filtersHTML = `<button class="filter-chip ${filter === 'all' ? 'active' : ''}" data-filter="all">全部 (${mistakes.length})</button>`;
    subjects.forEach(s => {
      const count = mistakes.filter(m => {
        const q = questions.find(qq => qq.id === m.questionId);
        return q && q.subject === s.id;
      }).length;
      if (count > 0) {
        filtersHTML += `<button class="filter-chip ${filter === s.id ? 'active' : ''}" data-filter="${s.id}">${s.name} (${count})</button>`;
      }
    });

    let filtered = [...mistakes].reverse();
    if (filter !== 'all') {
      filtered = filtered.filter(m => {
        const q = questions.find(qq => qq.id === m.questionId);
        return q && q.subject === filter;
      });
    }

    let listHTML = '';
    if (filtered.length === 0) {
      listHTML = `
        <div class="empty-state">
          <div class="empty-state-icon" style="color:var(--accent-green)">&#10003;</div>
          <h3>暂无错题</h3>
          <p>继续保持，争取零错题！</p>
        </div>`;
    } else {
      filtered.forEach(m => {
        const q = questions.find(qq => qq.id === m.questionId);
        if (!q) return;
        const subject = subjects.find(s => s.id === q.subject);
        const dateStr = formatDateCN(m.addedAt);
        const optionsHTML = q.options.map((opt, i) =>
          `<p style="padding:2px 0;font-size:0.82rem;${i === q.answer ? 'color:var(--accent-green);font-weight:600;' : 'color:var(--text-muted);'}">${MARKERS[i]}. ${opt}</p>`
        ).join('');

        listHTML += `
          <div class="mistake-card">
            <div class="mistake-card-header">
              <div style="display:flex;gap:8px;align-items:center;">
                <span class="badge badge-gold">${subject ? subject.name : ''}</span>
                <span class="badge badge-red">错题</span>
              </div>
              <span class="mistake-info">${dateStr} · 复习 ${m.reviewCount} 次</span>
            </div>
            <div class="mistake-card-body">
              <p style="margin-bottom:10px;font-weight:500;color:var(--text-primary);">${q.stem}</p>
              ${optionsHTML}
            </div>
            <div class="mistake-card-footer">
              <p style="font-size:0.78rem;color:var(--text-secondary);line-height:1.6;"><strong style="color:var(--accent-blue);">解析：</strong>${q.explanation}</p>
              <button class="btn btn-ghost btn-sm" data-remove="${q.id}" style="flex-shrink:0;">&#10003; 已掌握</button>
            </div>
          </div>`;
      });
    }

    container.innerHTML = `
      <div class="mistake-filters">
        <div class="filter-group" id="mistakeFilters">${filtersHTML}</div>
        <button class="btn btn-ghost btn-sm" id="btnClearMistakes">清空错题本</button>
      </div>
      <div id="mistakeList">${listHTML}</div>`;

    this.#bindEvents();
  },

  destroy() {},

  #bindEvents() {
    // Filters
    $('#mistakeFilters', container)?.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter]');
      if (!chip) return;
      filter = chip.dataset.filter;
      this.render();
    });

    // Remove single mistake
    $('#mistakeList', container)?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove]');
      if (!btn) return;
      const qid = btn.dataset.remove;
      store.remove('mistakes', m => m.questionId === qid);
      this.render();
    });

    // Clear all
    $('#btnClearMistakes', container)?.addEventListener('click', () => {
      if (confirm('确定要清空所有错题吗？')) {
        store.set('mistakes', []);
        this.render();
      }
    });
  }
};
