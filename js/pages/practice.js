/**
 * 法考通 · 刷题练习页面
 */
import { $, html } from '../utils/dom.js';
import { shuffle, MARKERS } from '../utils/helpers.js';

let store, subjects, questions, container;
let practiceState = { active: false, questions: [], currentIndex: 0, answered: false, selectedOption: -1, results: [] };
let practiceFilter = 'all';

export default {
  init(_container, _store, data) {
    store = _store;
    subjects = data.subjects;
    questions = data.questions;
    container = _container;
    practiceState = { active: false, questions: [], currentIndex: 0, answered: false, selectedOption: -1, results: [] };
    practiceFilter = 'all';
    this.render();
  },

  render() {
    let filtersHTML = `<button class="filter-chip ${practiceFilter === 'all' ? 'active' : ''}" data-filter="all">全部</button>`;
    subjects.forEach(s => {
      filtersHTML += `<button class="filter-chip ${practiceFilter === s.id ? 'active' : ''}" data-filter="${s.id}">${s.name}</button>`;
    });

    container.innerHTML = `
      <div class="practice-header">
        <div class="filter-group" id="practiceFilters">${filtersHTML}</div>
        <div>
          <button class="btn btn-primary btn-sm" id="btnStartPractice">&#9654; 开始练习</button>
          <button class="btn btn-ghost btn-sm" id="btnResetPractice">重置</button>
        </div>
      </div>
      <div id="practiceArea">
        <div class="empty-state">
          <div class="empty-state-icon">&#9998;</div>
          <h3>选择学科，开始练习</h3>
          <p>从上方筛选学科范围，然后点击"开始练习"进入答题模式</p>
        </div>
      </div>`;

    this._bindEvents();

    if (practiceState.active) {
      this._renderQuestion();
    }
  },

  destroy() {},

  // ---- Private ----

  _bindEvents() {
    // Filter chips
    $('#practiceFilters', container)?.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter]');
      if (!chip) return;
      practiceFilter = chip.dataset.filter;
      this.render();
    });

    // Start
    $('#btnStartPractice', container)?.addEventListener('click', () => this._startPractice());

    // Reset
    $('#btnResetPractice', container)?.addEventListener('click', () => {
      practiceState = { active: false, questions: [], currentIndex: 0, answered: false, selectedOption: -1, results: [] };
      this.render();
    });
  },

  _startPractice() {
    let pool = practiceFilter === 'all' ? [...questions] : questions.filter(q => q.subject === practiceFilter);
    pool = shuffle(pool);
    practiceState = { active: true, questions: pool, currentIndex: 0, answered: false, selectedOption: -1, results: [] };
    this._renderQuestion();
  },

  _renderQuestion() {
    const area = $('#practiceArea', container);
    if (!area) return;

    if (!practiceState.active || practiceState.currentIndex >= practiceState.questions.length) {
      if (practiceState.active) {
        const total = practiceState.results.length;
        const correct = practiceState.results.filter(r => r).length;
        area.innerHTML = `
          <div class="card" style="text-align:center;padding:48px 24px;">
            <div style="font-size:3rem;margin-bottom:16px;">&#127942;</div>
            <h2 style="font-family:var(--font-serif);font-size:1.5rem;margin-bottom:12px;">练习完成！</h2>
            <p style="font-size:1rem;color:var(--text-secondary);margin-bottom:24px;">
              本轮共 <strong style="color:var(--accent-gold)">${total}</strong> 题，
              正确 <strong style="color:var(--accent-green)">${correct}</strong> 题，
              错误 <strong style="color:var(--accent-red)">${total - correct}</strong> 题，
              正确率 <strong style="color:var(--accent-blue)">${total > 0 ? Math.round(correct / total * 100) : 0}%</strong>
            </p>
            <button class="btn btn-primary" id="btnAgain">再来一轮</button>
            <button class="btn btn-ghost" style="margin-left:12px;" id="btnBack">返回</button>
          </div>`;
        area.querySelector('#btnAgain')?.addEventListener('click', () => this._startPractice());
        area.querySelector('#btnBack')?.addEventListener('click', () => {
          practiceState.active = false;
          this.render();
        });
      }
      return;
    }

    const q = practiceState.questions[practiceState.currentIndex];
    const subject = subjects.find(s => s.id === q.subject);
    const isAnswered = practiceState.answered;
    const selected = practiceState.selectedOption;
    const isCorrect = selected === q.answer;

    let optionsHtml = '';
    q.options.forEach((opt, i) => {
      let cls = '';
      if (isAnswered) {
        if (i === q.answer) cls = 'correct';
        else if (i === selected) cls = 'wrong';
      } else if (i === selected) {
        cls = 'selected';
      }
      optionsHtml += `
        <div class="option-item ${cls}" data-idx="${i}">
          <div class="option-marker">${MARKERS[i]}</div>
          <div class="option-text">${opt}</div>
        </div>`;
    });

    area.innerHTML = `
      <div class="question-card animate-in">
        <div class="question-meta">
          <span class="badge badge-gold">${subject ? subject.name : ''}</span>
          <span class="badge badge-blue">第 ${practiceState.currentIndex + 1} / ${practiceState.questions.length} 题</span>
          <span class="badge ${q.type === 'single' ? 'badge-green' : 'badge-red'}">${q.type === 'single' ? '单选' : '多选'}</span>
        </div>
        <div class="question-body">
          <div class="question-stem">${q.stem}</div>
          <div class="options-list" id="optionsList">${optionsHtml}</div>
          <div class="question-explanation ${isAnswered ? 'show' : ''}">
            <h4>${isAnswered ? (isCorrect ? '&#10003; 回答正确' : '&#10007; 回答错误') : ''}</h4>
            <p>${q.explanation}</p>
          </div>
        </div>
        <div class="question-actions">
          <div class="question-actions-left">
            ${!isAnswered ? `<button class="btn btn-primary btn-sm" id="btnSubmit" ${selected < 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>确认答案</button>` : ''}
          </div>
          <div class="question-actions-right">
            ${isAnswered ? `<button class="btn btn-primary btn-sm" id="btnNext">下一题 &#8594;</button>` : ''}
          </div>
        </div>
      </div>`;

    // Bind option clicks
    if (!isAnswered) {
      area.querySelector('#optionsList')?.addEventListener('click', (e) => {
        const opt = e.target.closest('[data-idx]');
        if (!opt) return;
        practiceState.selectedOption = parseInt(opt.dataset.idx);
        this._renderQuestion();
      });
    }

    // Submit
    area.querySelector('#btnSubmit')?.addEventListener('click', () => this._submitAnswer());

    // Next
    area.querySelector('#btnNext')?.addEventListener('click', () => {
      practiceState.currentIndex++;
      practiceState.answered = false;
      practiceState.selectedOption = -1;
      this._renderQuestion();
    });
  },

  _submitAnswer() {
    if (practiceState.selectedOption < 0) return;
    practiceState.answered = true;
    const q = practiceState.questions[practiceState.currentIndex];
    const isCorrect = practiceState.selectedOption === q.answer;
    practiceState.results.push(isCorrect);

    // Update store
    store.increment('stats.totalAnswered');
    if (isCorrect) store.increment('stats.totalCorrect');

    const subProgress = store.get(`subjectProgress.${q.subject}`) || { answered: 0, correct: 0 };
    subProgress.answered++;
    if (isCorrect) subProgress.correct++;
    store.set(`subjectProgress.${q.subject}`, subProgress);

    // Auto-add to mistakes if wrong
    if (!isCorrect) {
      const mistakes = store.get('mistakes') || [];
      if (!mistakes.find(m => m.questionId === q.id)) {
        store.push('mistakes', { questionId: q.id, addedAt: Date.now(), reviewCount: 0 });
      }
    }

    this._renderQuestion();
  }
};
