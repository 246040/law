/**
 * 法考通 · 刷题练习页面
 * 支持单选、多选、不定项选择题
 */
import { $, html } from '../utils/dom.js';
import { shuffle, MARKERS } from '../utils/helpers.js';

let store, subjects, questions, container;
let practiceState = {
  active: false,
  questions: [],
  currentIndex: 0,
  answered: false,
  selectedOptions: [],  // 统一用数组，单选时为 [idx]，多选时为 [idx1, idx2, ...]
  results: []           // { correct: bool, score: 'full'|'partial'|'zero' }
};
let practiceFilter = 'all';

// ---- 评分工具 ----

/**
 * 判断是否为多选类型题目
 */
function isMultiType(q) {
  return q.type === 'multiple' || q.type === 'uncertain' || Array.isArray(q.answer);
}

/**
 * 计算答题得分
 * @returns {{ correct: boolean, score: 'full'|'partial'|'zero' }}
 */
function gradeAnswer(q, selectedOptions) {
  if (isMultiType(q)) {
    const correctSet = new Set(q.answer);
    const selectedSet = new Set(selectedOptions);

    // 检查是否有错选（选了不在正确答案中的）
    const hasWrong = selectedOptions.some(s => !correctSet.has(s));
    if (hasWrong || selectedOptions.length === 0) {
      return { correct: false, score: 'zero' };
    }

    // 全对
    if (selectedOptions.length === correctSet.size &&
        selectedOptions.every(s => correctSet.has(s))) {
      return { correct: true, score: 'full' };
    }

    // 少选得分
    return { correct: false, score: 'partial' };
  } else {
    // 单选
    const isCorrect = selectedOptions.length === 1 && selectedOptions[0] === q.answer;
    return { correct: isCorrect, score: isCorrect ? 'full' : 'zero' };
  }
}

export default {
  init(_container, _store, data) {
    store = _store;
    subjects = data.subjects;
    questions = data.questions;
    container = _container;
    practiceState = {
      active: false,
      questions: [],
      currentIndex: 0,
      answered: false,
      selectedOptions: [],
      results: []
    };
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
      practiceState = { active: false, questions: [], currentIndex: 0, answered: false, selectedOptions: [], results: [] };
      this.render();
    });
  },

  _startPractice() {
    let pool = practiceFilter === 'all' ? [...questions] : questions.filter(q => q.subject === practiceFilter);
    pool = shuffle(pool);
    practiceState = { active: true, questions: pool, currentIndex: 0, answered: false, selectedOptions: [], results: [] };
    this._renderQuestion();
  },

  _renderQuestion() {
    const area = $('#practiceArea', container);
    if (!area) return;

    if (!practiceState.active || practiceState.currentIndex >= practiceState.questions.length) {
      if (practiceState.active) {
        this._renderSummary(area);
      }
      return;
    }

    const q = practiceState.questions[practiceState.currentIndex];
    const subject = subjects.find(s => s.id === q.subject);
    const isAnswered = practiceState.answered;
    const selected = practiceState.selectedOptions;
    const isMulti = isMultiType(q);

    // 评分结果（已答题时）
    let grade = null;
    if (isAnswered) {
      grade = gradeAnswer(q, selected);
    }

    // 渲染选项
    let optionsHtml = '';
    q.options.forEach((opt, i) => {
      let cls = '';
      const isSelected = selected.includes(i);

      if (isAnswered) {
        const correctAnswers = isMulti ? q.answer : [q.answer];
        const isCorrectOption = correctAnswers.includes(i);
        if (isCorrectOption) cls = 'correct';
        else if (isSelected) cls = 'wrong';
      } else if (isSelected) {
        cls = 'selected';
      }

      // 单选用圆点，多选用复选框
      const marker = isMulti
        ? `<div class="option-checkbox ${isSelected ? 'checked' : ''}">${isSelected ? '&#10003;' : ''}</div>`
        : `<div class="option-marker">${MARKERS[i]}</div>`;

      optionsHtml += `
        <div class="option-item ${cls} ${isMulti ? 'option-multi' : ''}" data-idx="${i}">
          ${marker}
          <div class="option-text">${opt}</div>
        </div>`;
    });

    // 题型标签
    let typeBadge = '';
    if (q.type === 'single') {
      typeBadge = '<span class="badge badge-green">单选</span>';
    } else if (q.type === 'multiple') {
      typeBadge = '<span class="badge badge-red">多选</span>';
    } else if (q.type === 'uncertain') {
      typeBadge = '<span class="badge badge-purple">不定项</span>';
    } else {
      typeBadge = `<span class="badge ${isMulti ? 'badge-red' : 'badge-green'}">${isMulti ? '多选' : '单选'}</span>`;
    }

    // 提交按钮禁用逻辑
    let submitDisabled = false;
    if (selected.length === 0) {
      submitDisabled = true;
    } else if (isMulti && q.type === 'multiple' && selected.length < 2) {
      submitDisabled = true; // 多选题至少选2个
    }

    // 答题结果提示
    let resultHint = '';
    if (isAnswered && grade) {
      if (grade.score === 'full') {
        resultHint = '<h4 style="color:var(--accent-green);">&#10003; 回答正确</h4>';
      } else if (grade.score === 'partial') {
        resultHint = '<h4 style="color:var(--accent-blue);">&#9679; 少选得分（得该题一半分数）</h4>';
      } else {
        resultHint = '<h4 style="color:var(--accent-red);">&#10007; 回答错误</h4>';
      }
    }

    area.innerHTML = `
      <div class="question-card animate-in">
        <div class="question-meta">
          <span class="badge badge-gold">${subject ? subject.name : ''}</span>
          <span class="badge badge-blue">第 ${practiceState.currentIndex + 1} / ${practiceState.questions.length} 题</span>
          ${typeBadge}
        </div>
        <div class="question-body">
          <div class="question-stem">${q.stem}</div>
          ${isMulti && !isAnswered ? '<div class="question-hint">&#9432; 本题为多选题，请选择所有正确选项</div>' : ''}
          <div class="options-list" id="optionsList">${optionsHtml}</div>
          <div class="question-explanation ${isAnswered ? 'show' : ''}">
            ${resultHint}
            <p>${q.analysis || q.explanation || ''}</p>
            ${q.lawRef ? `<p class="law-ref">&#9878; ${q.lawRef}</p>` : ''}
          </div>
        </div>
        <div class="question-actions">
          <div class="question-actions-left">
            ${!isAnswered ? `<button class="btn btn-primary btn-sm" id="btnSubmit" ${submitDisabled ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>确认答案</button>` : ''}
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
        const idx = parseInt(opt.dataset.idx);

        if (isMulti) {
          // 多选：切换选中状态
          const pos = practiceState.selectedOptions.indexOf(idx);
          if (pos >= 0) {
            practiceState.selectedOptions.splice(pos, 1);
          } else {
            practiceState.selectedOptions.push(idx);
          }
        } else {
          // 单选：直接替换
          practiceState.selectedOptions = [idx];
        }
        this._renderQuestion();
      });
    }

    // Submit
    area.querySelector('#btnSubmit')?.addEventListener('click', () => this._submitAnswer());

    // Next
    area.querySelector('#btnNext')?.addEventListener('click', () => {
      practiceState.currentIndex++;
      practiceState.answered = false;
      practiceState.selectedOptions = [];
      this._renderQuestion();
    });
  },

  _renderSummary(area) {
    const results = practiceState.results;
    const total = results.length;
    const fullCorrect = results.filter(r => r.score === 'full').length;
    const partial = results.filter(r => r.score === 'partial').length;
    const wrong = results.filter(r => r.score === 'zero').length;
    const accuracy = total > 0 ? Math.round(fullCorrect / total * 100) : 0;

    area.innerHTML = `
      <div class="card" style="text-align:center;padding:48px 24px;">
        <div style="font-size:3rem;margin-bottom:16px;">&#127942;</div>
        <h2 style="font-family:var(--font-serif);font-size:1.5rem;margin-bottom:12px;">练习完成！</h2>
        <p style="font-size:1rem;color:var(--text-secondary);margin-bottom:8px;">
          本轮共 <strong style="color:var(--accent-gold)">${total}</strong> 题
        </p>
        <div style="display:flex;justify-content:center;gap:24px;margin:16px 0 24px;">
          <div>
            <div style="font-size:1.5rem;font-weight:700;color:var(--accent-green);">${fullCorrect}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">全对</div>
          </div>
          ${partial > 0 ? `<div>
            <div style="font-size:1.5rem;font-weight:700;color:var(--accent-blue);">${partial}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">半分</div>
          </div>` : ''}
          <div>
            <div style="font-size:1.5rem;font-weight:700;color:var(--accent-red);">${wrong}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">错误</div>
          </div>
          <div>
            <div style="font-size:1.5rem;font-weight:700;color:var(--accent-blue);">${accuracy}%</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">正确率</div>
          </div>
        </div>
        <button class="btn btn-primary" id="btnAgain">再来一轮</button>
        <button class="btn btn-ghost" style="margin-left:12px;" id="btnBack">返回</button>
      </div>`;
    area.querySelector('#btnAgain')?.addEventListener('click', () => this._startPractice());
    area.querySelector('#btnBack')?.addEventListener('click', () => {
      practiceState.active = false;
      this.render();
    });
  },

  _submitAnswer() {
    if (practiceState.selectedOptions.length === 0) return;
    practiceState.answered = true;
    const q = practiceState.questions[practiceState.currentIndex];
    const grade = gradeAnswer(q, practiceState.selectedOptions);
    practiceState.results.push(grade);

    // Update store
    store.increment('stats.totalAnswered');
    if (grade.correct) store.increment('stats.totalCorrect');

    const subProgress = store.get(`subjectProgress.${q.subject}`) || { answered: 0, correct: 0 };
    subProgress.answered++;
    if (grade.correct) subProgress.correct++;
    store.set(`subjectProgress.${q.subject}`, subProgress);

    // Auto-add to mistakes if not fully correct
    if (!grade.correct) {
      const mistakes = store.get('mistakes') || [];
      if (!mistakes.find(m => m.questionId === q.id)) {
        store.push('mistakes', {
          questionId: q.id,
          addedAt: Date.now(),
          reviewCount: 0,
          wrongOptions: [...practiceState.selectedOptions],
          score: grade.score
        });
      }
    }

    // 记录每日学习日志（用于趋势图和热力图）
    const today = new Date().toISOString().slice(0, 10);
    const dailyLog = store.get(`dailyLog.${today}`) || { answered: 0, correct: 0 };
    dailyLog.answered++;
    if (grade.correct) dailyLog.correct++;
    store.set(`dailyLog.${today}`, dailyLog);

    // 更新连续打卡天数
    const streak = store.get('streak') || { current: 0, best: 0, lastDate: null };
    if (streak.lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (streak.lastDate === yesterday) {
        // 连续：昨天有学习
        streak.current += 1;
      } else if (streak.lastDate === null) {
        // 首次使用
        streak.current = 1;
      } else {
        // 中断：重新计数
        streak.current = 1;
      }
      streak.lastDate = today;
      if (streak.current > streak.best) {
        streak.best = streak.current;
      }
      store.set('streak', streak);
    }

    this._renderQuestion();
  }
};
