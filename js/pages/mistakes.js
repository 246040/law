/**
 * 法考通 · 错题本页面
 * 支持按学科/知识点分类筛选、显示用户错选、批量重做
 */
import { $ } from '../utils/dom.js';
import { MARKERS, formatDateCN, shuffle } from '../utils/helpers.js';

let store, subjects, questions, container;
let filter = 'all';
let viewMode = 'list'; // 'list' | 'redo'
let redoState = { questions: [], currentIndex: 0, answered: false, selectedOptions: [], results: [] };

export default {
  init(_container, _store, data) {
    store = _store;
    subjects = data.subjects;
    questions = data.questions;
    container = _container;
    filter = 'all';
    viewMode = 'list';
    this.render();
  },

  render() {
    if (viewMode === 'redo') {
      this._renderRedo();
      return;
    }

    const mistakes = store.get('mistakes') || [];

    // 学科筛选
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

    // 知识点（topic）分组统计
    const topicCounts = {};
    mistakes.forEach(m => {
      const q = questions.find(qq => qq.id === m.questionId);
      if (q && q.topic) {
        topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
      }
    });
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    let topicHTML = '';
    if (topTopics.length > 0) {
      topicHTML = `<div class="mistake-topics">
        <span class="mistake-topics-label">高频错误：</span>
        ${topTopics.map(([topic, count]) =>
          `<button class="filter-chip ${filter === 'topic:' + topic ? 'active' : ''}" data-filter="topic:${topic}">${topic} (${count})</button>`
        ).join('')}
      </div>`;
    }

    // 筛选数据
    let filtered = [...mistakes].reverse();
    if (filter !== 'all') {
      if (filter.startsWith('topic:')) {
        const topicName = filter.slice(6);
        filtered = filtered.filter(m => {
          const q = questions.find(qq => qq.id === m.questionId);
          return q && q.topic === topicName;
        });
      } else {
        filtered = filtered.filter(m => {
          const q = questions.find(qq => qq.id === m.questionId);
          return q && q.subject === filter;
        });
      }
    }

    // 渲染错题列表
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

        // 显示选项（标注正确答案和用户错选）
        const correctAnswers = Array.isArray(q.answer) ? q.answer : [q.answer];
        const wrongOptions = m.wrongOptions || [];

        const optionsHTML = q.options.map((opt, i) => {
          let style = 'padding:2px 0;font-size:0.82rem;';
          let prefix = '';
          if (correctAnswers.includes(i)) {
            style += 'color:var(--accent-green);font-weight:600;';
            prefix = '✓ ';
          } else if (wrongOptions.includes(i)) {
            style += 'color:var(--accent-red);text-decoration:line-through;';
            prefix = '✗ ';
          } else {
            style += 'color:var(--text-muted);';
          }
          return `<p style="${style}">${prefix}${MARKERS[i]}. ${opt}</p>`;
        }).join('');

        // 得分标记
        let scoreBadge = '<span class="badge badge-red">错误</span>';
        if (m.score === 'partial') {
          scoreBadge = '<span class="badge badge-blue">少选</span>';
        }

        listHTML += `
          <div class="mistake-card">
            <div class="mistake-card-header">
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <span class="badge badge-gold">${subject ? subject.name : ''}</span>
                ${scoreBadge}
                ${q.topic ? `<span class="badge badge-purple">${q.topic}</span>` : ''}
              </div>
              <span class="mistake-info">${dateStr} · 复习 ${m.reviewCount} 次</span>
            </div>
            <div class="mistake-card-body">
              <p style="margin-bottom:10px;font-weight:500;color:var(--text-primary);">${q.stem}</p>
              ${optionsHTML}
            </div>
            <div class="mistake-card-footer">
              <p style="font-size:0.78rem;color:var(--text-secondary);line-height:1.6;"><strong style="color:var(--accent-blue);">解析：</strong>${q.explanation || q.analysis || ''}</p>
              <button class="btn btn-ghost btn-sm" data-remove="${q.id}" style="flex-shrink:0;">&#10003; 已掌握</button>
            </div>
          </div>`;
      });
    }

    container.innerHTML = `
      <div class="mistake-filters">
        <div class="filter-group" id="mistakeFilters">${filtersHTML}</div>
        <div style="display:flex;gap:8px;">
          ${filtered.length > 0 ? `<button class="btn btn-primary btn-sm" id="btnRedoMistakes">&#8634; 重做错题 (${filtered.length})</button>` : ''}
          <button class="btn btn-ghost btn-sm" id="btnClearMistakes">清空错题本</button>
        </div>
      </div>
      ${topicHTML}
      <div id="mistakeList">${listHTML}</div>`;

    this._bindEvents(filtered);
  },

  destroy() {},

  _bindEvents(filtered) {
    // Filters (学科)
    $('#mistakeFilters', container)?.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter]');
      if (!chip) return;
      filter = chip.dataset.filter;
      this.render();
    });

    // Filters (topic)
    container.querySelector('.mistake-topics')?.addEventListener('click', (e) => {
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

    // Redo mistakes
    $('#btnRedoMistakes', container)?.addEventListener('click', () => {
      const mistakeQuestions = (filtered || []).map(m =>
        questions.find(qq => qq.id === m.questionId)
      ).filter(Boolean);
      if (mistakeQuestions.length === 0) return;
      redoState = {
        questions: shuffle(mistakeQuestions),
        currentIndex: 0,
        answered: false,
        selectedOptions: [],
        results: []
      };
      viewMode = 'redo';
      this._renderRedo();
    });

    // Clear all
    $('#btnClearMistakes', container)?.addEventListener('click', () => {
      if (confirm('确定要清空所有错题吗？')) {
        store.set('mistakes', []);
        this.render();
      }
    });
  },

  _renderRedo() {
    if (redoState.currentIndex >= redoState.questions.length) {
      // 重做完成
      const total = redoState.results.length;
      const correct = redoState.results.filter(r => r).length;
      container.innerHTML = `
        <div class="card" style="text-align:center;padding:48px 24px;">
          <div style="font-size:3rem;margin-bottom:16px;">&#127942;</div>
          <h2 style="font-family:var(--font-serif);font-size:1.5rem;margin-bottom:12px;">错题重做完成！</h2>
          <p style="font-size:1rem;color:var(--text-secondary);margin-bottom:24px;">
            共 <strong style="color:var(--accent-gold)">${total}</strong> 题，
            正确 <strong style="color:var(--accent-green)">${correct}</strong> 题，
            正确率 <strong style="color:var(--accent-blue)">${total > 0 ? Math.round(correct / total * 100) : 0}%</strong>
          </p>
          <button class="btn btn-primary" id="btnBackList">返回错题本</button>
        </div>`;
      container.querySelector('#btnBackList')?.addEventListener('click', () => {
        viewMode = 'list';
        this.render();
      });
      return;
    }

    const q = redoState.questions[redoState.currentIndex];
    const subject = subjects.find(s => s.id === q.subject);
    const isAnswered = redoState.answered;
    const selected = redoState.selectedOptions;
    const isMulti = Array.isArray(q.answer);

    let isCorrect = false;
    if (isAnswered) {
      if (isMulti) {
        const correctSet = new Set(q.answer);
        isCorrect = selected.length === correctSet.size && selected.every(s => correctSet.has(s));
      } else {
        isCorrect = selected.length === 1 && selected[0] === q.answer;
      }
    }

    const correctAnswers = isMulti ? q.answer : [q.answer];
    let optionsHtml = '';
    q.options.forEach((opt, i) => {
      let cls = '';
      const isSelected = selected.includes(i);
      if (isAnswered) {
        if (correctAnswers.includes(i)) cls = 'correct';
        else if (isSelected) cls = 'wrong';
      } else if (isSelected) {
        cls = 'selected';
      }

      const marker = isMulti
        ? `<div class="option-checkbox ${isSelected ? 'checked' : ''}">${isSelected ? '&#10003;' : ''}</div>`
        : `<div class="option-marker">${MARKERS[i]}</div>`;

      optionsHtml += `
        <div class="option-item ${cls} ${isMulti ? 'option-multi' : ''}" data-idx="${i}">
          ${marker}
          <div class="option-text">${opt}</div>
        </div>`;
    });

    container.innerHTML = `
      <div class="question-card animate-in">
        <div class="question-meta">
          <span class="badge badge-gold">${subject ? subject.name : ''}</span>
          <span class="badge badge-red">错题重做</span>
          <span class="badge badge-blue">第 ${redoState.currentIndex + 1} / ${redoState.questions.length} 题</span>
        </div>
        <div class="question-body">
          <div class="question-stem">${q.stem}</div>
          <div class="options-list" id="redoOptions">${optionsHtml}</div>
          <div class="question-explanation ${isAnswered ? 'show' : ''}">
            <h4>${isAnswered ? (isCorrect ? '&#10003; 回答正确' : '&#10007; 回答错误') : ''}</h4>
            <p>${q.analysis || q.explanation || ''}</p>
          </div>
        </div>
        <div class="question-actions">
          <div class="question-actions-left">
            ${!isAnswered ? `<button class="btn btn-primary btn-sm" id="btnRedoSubmit" ${selected.length === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>确认答案</button>` : ''}
            <button class="btn btn-ghost btn-sm" id="btnRedoQuit">退出重做</button>
          </div>
          <div class="question-actions-right">
            ${isAnswered ? `<button class="btn btn-primary btn-sm" id="btnRedoNext">下一题 &#8594;</button>` : ''}
          </div>
        </div>
      </div>`;

    // Bind events
    if (!isAnswered) {
      container.querySelector('#redoOptions')?.addEventListener('click', (e) => {
        const opt = e.target.closest('[data-idx]');
        if (!opt) return;
        const idx = parseInt(opt.dataset.idx);
        if (isMulti) {
          const pos = redoState.selectedOptions.indexOf(idx);
          if (pos >= 0) redoState.selectedOptions.splice(pos, 1);
          else redoState.selectedOptions.push(idx);
        } else {
          redoState.selectedOptions = [idx];
        }
        this._renderRedo();
      });
    }

    container.querySelector('#btnRedoSubmit')?.addEventListener('click', () => {
      redoState.answered = true;
      const q = redoState.questions[redoState.currentIndex];
      let correct = false;
      if (isMulti) {
        const correctSet = new Set(q.answer);
        correct = redoState.selectedOptions.length === correctSet.size &&
                  redoState.selectedOptions.every(s => correctSet.has(s));
      } else {
        correct = redoState.selectedOptions[0] === q.answer;
      }
      redoState.results.push(correct);

      // 如果答对了，增加错题的 reviewCount
      if (correct) {
        const mistakes = store.get('mistakes') || [];
        const m = mistakes.find(m => m.questionId === q.id);
        if (m) {
          m.reviewCount = (m.reviewCount || 0) + 1;
          store.set('mistakes', mistakes);
        }
      }

      this._renderRedo();
    });

    container.querySelector('#btnRedoNext')?.addEventListener('click', () => {
      redoState.currentIndex++;
      redoState.answered = false;
      redoState.selectedOptions = [];
      this._renderRedo();
    });

    container.querySelector('#btnRedoQuit')?.addEventListener('click', () => {
      viewMode = 'list';
      this.render();
    });
  }
};
