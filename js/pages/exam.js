/**
 * 法考通 · 模考页面
 * 完整模拟法考客观题考试流程
 */
import { $, $$ } from '../utils/dom.js';
import { MARKERS } from '../utils/helpers.js';
import { ExamEngine, EXAM_CONFIGS, gradeQuestion } from '../exam-engine.js';

let store, subjects, questions, container;
let engine = null;
let currentIndex = 0;
let selectedOptions = [];
let showPanel = false; // 题目导航面板

export default {
  init(_container, _store, data) {
    store = _store;
    subjects = data.subjects;
    questions = data.questions;
    container = _container;
    engine = null;
    currentIndex = 0;
    selectedOptions = [];
    showPanel = false;
    this._renderModeSelect();
  },

  render() {
    if (!engine || engine.status === 'idle') {
      this._renderModeSelect();
    } else if (engine.status === 'running' || engine.status === 'paused') {
      this._renderExam();
    } else if (engine.status === 'finished') {
      this._renderReport();
    }
  },

  destroy() {
    if (engine) {
      engine._stopTimer();
    }
  },

  // ---- 模式选择 ----
  _renderModeSelect() {
    container.innerHTML = `
      <div class="exam-mode-select">
        <div class="exam-hero">
          <div style="font-size:2.5rem;margin-bottom:12px;">📋</div>
          <h2 style="font-family:var(--font-serif);font-size:1.4rem;margin-bottom:8px;">模拟考试</h2>
          <p style="color:var(--text-muted);font-size:0.84rem;">像真正的法考一样限时答题，检验你的应试水平</p>
        </div>

        <div class="exam-modes-grid">
          <div class="exam-mode-card" data-mode="paper1">
            <div class="exam-mode-icon">📝</div>
            <h3>卷一模考</h3>
            <p>刑法、刑诉、行政法、宪法、法理学</p>
            <div class="exam-mode-info">
              <span>100题</span><span>180分钟</span><span>150分</span>
            </div>
          </div>

          <div class="exam-mode-card" data-mode="paper2">
            <div class="exam-mode-icon">📝</div>
            <h3>卷二模考</h3>
            <p>民法、民诉、商法、经济法、国际法</p>
            <div class="exam-mode-info">
              <span>100题</span><span>180分钟</span><span>150分</span>
            </div>
          </div>

          <div class="exam-mode-card" data-mode="mini">
            <div class="exam-mode-icon">⚡</div>
            <h3>迷你模考</h3>
            <p>全科随机组卷，快速评估水平</p>
            <div class="exam-mode-info">
              <span>30题</span><span>45分钟</span><span>45分</span>
            </div>
          </div>

          <div class="exam-mode-card" data-mode="subject">
            <div class="exam-mode-icon">🎯</div>
            <h3>学科专项</h3>
            <p>选择单科集中突破</p>
            <div class="exam-mode-info">
              <span>20题</span><span>30分钟</span><span>30分</span>
            </div>
          </div>
        </div>

        <div id="subjectSelect" style="display:none;margin-top:20px;">
          <p style="font-size:0.84rem;color:var(--text-secondary);margin-bottom:12px;">选择学科：</p>
          <div class="filter-group" id="examSubjectFilter">
            ${subjects.map(s => `<button class="filter-chip" data-subject="${s.id}">${s.name}</button>`).join('')}
          </div>
        </div>
      </div>`;

    // 绑定事件
    container.querySelectorAll('.exam-mode-card').forEach(card => {
      card.addEventListener('click', () => {
        const mode = card.dataset.mode;
        if (mode === 'subject') {
          // 显示学科选择
          const sel = $('#subjectSelect', container);
          if (sel) sel.style.display = 'block';
          // 高亮选中卡片
          container.querySelectorAll('.exam-mode-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
        } else {
          this._startExam(mode);
        }
      });
    });

    // 学科选择
    $('#examSubjectFilter', container)?.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-subject]');
      if (!chip) return;
      const subjectId = chip.dataset.subject;
      const config = { ...EXAM_CONFIGS.subject, subjects: [subjectId], name: `${subjects.find(s => s.id === subjectId)?.name || ''}专项` };
      this._startExamWithConfig(config);
    });
  },

  _startExam(mode) {
    const config = EXAM_CONFIGS[mode];
    if (!config) return;
    this._startExamWithConfig(config);
  },

  _startExamWithConfig(config) {
    engine = new ExamEngine(config, questions);
    engine.generatePaper();

    if (engine.questions.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center;padding:48px;">
          <p style="color:var(--accent-red);">题库不足，无法组卷。请先补充更多题目。</p>
          <button class="btn btn-ghost btn-sm" id="btnBackSelect" style="margin-top:16px;">返回</button>
        </div>`;
      container.querySelector('#btnBackSelect')?.addEventListener('click', () => this._renderModeSelect());
      return;
    }

    engine.onTick = (remaining) => {
      const timerEl = $('#examTimer', container);
      if (timerEl) {
        timerEl.textContent = ExamEngine.formatTime(remaining);
        if (remaining <= 600) timerEl.classList.add('warning'); // 最后10分钟变红
      }
    };

    engine.onTimeUp = () => {
      this._renderReport();
    };

    currentIndex = 0;
    selectedOptions = [];
    engine.start();
    this._renderExam();
  },

  // ---- 考试答题界面 ----
  _renderExam() {
    const q = engine.questions[currentIndex];
    if (!q) return;

    const progress = engine.getProgress();
    const isMulti = q.type === 'multiple' || q.type === 'uncertain' || Array.isArray(q.answer);
    const saved = engine.answers[q.id] || [];
    const displaySelected = saved.length > 0 ? saved : selectedOptions;
    const status = engine.getQuestionStatus(q.id);

    // 题型标签
    let typeLabel = '单选';
    if (q.type === 'multiple') typeLabel = '多选';
    else if (q.type === 'uncertain') typeLabel = '不定项';

    // 选项 HTML
    let optionsHtml = '';
    q.options.forEach((opt, i) => {
      const isSelected = displaySelected.includes(i);
      const cls = isSelected ? 'selected' : '';
      const marker = isMulti
        ? `<div class="option-checkbox ${isSelected ? 'checked' : ''}">${isSelected ? '&#10003;' : ''}</div>`
        : `<div class="option-marker">${MARKERS[i]}</div>`;

      optionsHtml += `
        <div class="option-item ${cls}" data-idx="${i}">
          ${marker}
          <div class="option-text">${opt}</div>
        </div>`;
    });

    // 导航面板
    let panelHtml = '';
    if (showPanel) {
      let panelItems = '';
      engine.questions.forEach((pq, idx) => {
        const pStatus = engine.getQuestionStatus(pq.id);
        let cls = 'exam-nav-item';
        if (idx === currentIndex) cls += ' current';
        if (pStatus.answered) cls += ' answered';
        if (pStatus.marked) cls += ' marked';
        panelItems += `<div class="${cls}" data-goto="${idx}">${idx + 1}</div>`;
      });
      panelHtml = `
        <div class="exam-nav-panel">
          <div class="exam-nav-panel-header">
            <span>题目导航</span>
            <span style="font-size:0.72rem;color:var(--text-muted);">已答 ${progress.answered}/${progress.total}</span>
          </div>
          <div class="exam-nav-grid">${panelItems}</div>
          <div class="exam-nav-legend">
            <span><span class="dot answered"></span>已答</span>
            <span><span class="dot marked"></span>标记</span>
            <span><span class="dot current"></span>当前</span>
          </div>
        </div>`;
    }

    container.innerHTML = `
      <div class="exam-container">
        <div class="exam-topbar">
          <div class="exam-topbar-left">
            <span class="badge badge-gold">${engine.config.name}</span>
            <span class="exam-progress-text">${currentIndex + 1} / ${progress.total}</span>
          </div>
          <div class="exam-topbar-center">
            <div class="exam-timer ${engine.timeRemaining <= 600 ? 'warning' : ''}" id="examTimer">
              ${ExamEngine.formatTime(engine.timeRemaining)}
            </div>
          </div>
          <div class="exam-topbar-right">
            <button class="btn btn-ghost btn-sm" id="btnTogglePanel">📋 导航</button>
            <button class="btn btn-ghost btn-sm exam-finish-btn" id="btnFinish">交卷</button>
          </div>
        </div>

        <div class="exam-body">
          <div class="exam-question-area">
            <div class="question-card">
              <div class="question-meta">
                <span class="badge ${q.type === 'single' ? 'badge-green' : q.type === 'uncertain' ? 'badge-purple' : 'badge-red'}">${typeLabel}</span>
                <span class="badge badge-blue">第 ${currentIndex + 1} 题</span>
                ${status.marked ? '<span class="badge badge-gold">★ 已标记</span>' : ''}
              </div>
              <div class="question-body">
                <div class="question-stem">${q.stem}</div>
                ${isMulti ? '<div class="question-hint">&#9432; 本题为多选题，请选择所有正确选项</div>' : ''}
                <div class="options-list" id="examOptions">${optionsHtml}</div>
              </div>
            </div>
          </div>
          ${panelHtml}
        </div>

        <div class="exam-bottombar">
          <div class="exam-bottombar-left">
            <button class="btn btn-ghost btn-sm" id="btnMark">${status.marked ? '★ 取消标记' : '☆ 标记本题'}</button>
          </div>
          <div class="exam-bottombar-right">
            <button class="btn btn-ghost btn-sm" id="btnPrevQ" ${currentIndex === 0 ? 'disabled style="opacity:0.4;"' : ''}>← 上一题</button>
            <button class="btn btn-primary btn-sm" id="btnNextQ">${currentIndex === progress.total - 1 ? '检查答案' : '下一题 →'}</button>
          </div>
        </div>
      </div>`;

    this._bindExamEvents();
  },

  _bindExamEvents() {
    const q = engine.questions[currentIndex];
    const isMulti = q.type === 'multiple' || q.type === 'uncertain' || Array.isArray(q.answer);

    // 选项点击
    $('#examOptions', container)?.addEventListener('click', (e) => {
      const opt = e.target.closest('[data-idx]');
      if (!opt) return;
      const idx = parseInt(opt.dataset.idx);

      if (isMulti) {
        const pos = selectedOptions.indexOf(idx);
        if (pos >= 0) selectedOptions.splice(pos, 1);
        else selectedOptions.push(idx);
      } else {
        selectedOptions = [idx];
      }

      // 自动保存答案
      engine.submitAnswer(q.id, selectedOptions);
      this._renderExam();
    });

    // 导航面板
    $('#btnTogglePanel', container)?.addEventListener('click', () => {
      showPanel = !showPanel;
      this._renderExam();
    });

    // 面板跳转
    container.querySelector('.exam-nav-grid')?.addEventListener('click', (e) => {
      const item = e.target.closest('[data-goto]');
      if (!item) return;
      // 保存当前答案
      engine.submitAnswer(q.id, selectedOptions);
      currentIndex = parseInt(item.dataset.goto);
      selectedOptions = [...(engine.answers[engine.questions[currentIndex].id] || [])];
      this._renderExam();
    });

    // 标记
    $('#btnMark', container)?.addEventListener('click', () => {
      engine.toggleMark(q.id);
      this._renderExam();
    });

    // 上一题
    $('#btnPrevQ', container)?.addEventListener('click', () => {
      if (currentIndex <= 0) return;
      engine.submitAnswer(q.id, selectedOptions);
      currentIndex--;
      selectedOptions = [...(engine.answers[engine.questions[currentIndex].id] || [])];
      this._renderExam();
    });

    // 下一题
    $('#btnNextQ', container)?.addEventListener('click', () => {
      engine.submitAnswer(q.id, selectedOptions);
      if (currentIndex < engine.questions.length - 1) {
        currentIndex++;
        selectedOptions = [...(engine.answers[engine.questions[currentIndex].id] || [])];
        this._renderExam();
      } else {
        // 最后一题，显示交卷确认
        this._showFinishConfirm();
      }
    });

    // 交卷
    $('#btnFinish', container)?.addEventListener('click', () => {
      this._showFinishConfirm();
    });
  },

  _showFinishConfirm() {
    const progress = engine.getProgress();
    const msg = progress.unanswered > 0
      ? `还有 ${progress.unanswered} 道题未作答，确定要交卷吗？`
      : '确定要交卷吗？';

    if (confirm(msg)) {
      const report = engine.finish();
      // 保存到历史
      const examHistory = store.get('examHistory') || [];
      examHistory.push({
        config: engine.config.name,
        report,
        timestamp: Date.now()
      });
      store.set('examHistory', examHistory);
      this._renderReport();
    }
  },

  // ---- 成绩报告 ----
  _renderReport() {
    const report = engine.getReport();
    const passClass = report.passed ? 'exam-pass' : 'exam-fail';
    const passText = report.passed ? '🎉 达到参考及格线！' : '📚 继续努力，下次一定！';

    // 学科得分
    let subjectRows = '';
    Object.entries(report.bySubject).forEach(([subId, data]) => {
      const sub = subjects.find(s => s.id === subId);
      const pct = data.total > 0 ? Math.round(data.points / data.total * 100) : 0;
      subjectRows += `
        <tr>
          <td>${sub ? sub.name : subId}</td>
          <td>${data.points} / ${data.total}</td>
          <td><div class="progress-bar" style="width:100px;display:inline-block;vertical-align:middle;"><div class="progress-bar-fill" style="width:${pct}%;background:${pct >= 60 ? 'var(--accent-green)' : 'var(--accent-red)'};"></div></div> ${pct}%</td>
        </tr>`;
    });

    // 用时格式化
    const minutes = Math.floor(report.duration / 60);
    const seconds = report.duration % 60;

    container.innerHTML = `
      <div class="exam-report">
        <div class="exam-report-hero ${passClass}">
          <div class="exam-report-score">${report.score}<span>/${report.totalScore}</span></div>
          <div class="exam-report-pass-line">及格线：${report.passScore} 分</div>
          <p class="exam-report-verdict">${passText}</p>
        </div>

        <div class="exam-report-stats">
          <div class="stat-card">
            <div class="stat-label">用时</div>
            <div class="stat-value">${minutes}:${String(seconds).padStart(2, '0')}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">全对</div>
            <div class="stat-value" style="color:var(--accent-green);">${report.fullCount}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">半分</div>
            <div class="stat-value" style="color:var(--accent-blue);">${report.partialCount}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">错误</div>
            <div class="stat-value" style="color:var(--accent-red);">${report.wrongCount}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">未答</div>
            <div class="stat-value" style="color:var(--text-muted);">${report.unansweredCount}</div>
          </div>
        </div>

        <div class="card" style="margin-top:20px;">
          <h3 class="card-title">学科得分</h3>
          <table class="exam-report-table">
            <thead><tr><th>学科</th><th>得分</th><th>正确率</th></tr></thead>
            <tbody>${subjectRows}</tbody>
          </table>
        </div>

        <div style="text-align:center;margin-top:24px;">
          <button class="btn btn-primary" id="btnReviewExam">查看解析</button>
          <button class="btn btn-ghost" id="btnNewExam" style="margin-left:12px;">再来一场</button>
        </div>
      </div>`;

    // 事件
    $('#btnReviewExam', container)?.addEventListener('click', () => this._renderReview());
    $('#btnNewExam', container)?.addEventListener('click', () => {
      engine = null;
      this._renderModeSelect();
    });
  },

  // ---- 查看解析 ----
  _renderReview() {
    let reviewHTML = '';
    engine.questions.forEach((q, idx) => {
      const selected = engine.answers[q.id] || [];
      const grade = gradeQuestion(q, selected);
      const isMulti = Array.isArray(q.answer);
      const correctAnswers = isMulti ? q.answer : [q.answer];
      const subject = subjects.find(s => s.id === q.subject);

      let scoreClass = 'correct';
      let scoreLabel = '✓ 正确';
      if (grade.score === 'partial') { scoreClass = 'partial'; scoreLabel = '◐ 少选'; }
      else if (grade.score === 'zero') { scoreClass = 'wrong'; scoreLabel = '✗ 错误'; }
      if (selected.length === 0) { scoreClass = 'wrong'; scoreLabel = '— 未答'; }

      const optionsHTML = q.options.map((opt, i) => {
        let style = '';
        let prefix = '';
        if (correctAnswers.includes(i)) {
          style = 'color:var(--accent-green);font-weight:600;';
          prefix = '✓ ';
        } else if (selected.includes(i)) {
          style = 'color:var(--accent-red);text-decoration:line-through;';
          prefix = '✗ ';
        } else {
          style = 'color:var(--text-muted);';
        }
        return `<p style="${style}font-size:0.82rem;padding:2px 0;">${prefix}${MARKERS[i]}. ${opt}</p>`;
      }).join('');

      reviewHTML += `
        <div class="review-item review-${scoreClass}">
          <div class="review-item-header">
            <span class="badge badge-blue">#${idx + 1}</span>
            <span class="badge badge-gold">${subject ? subject.name : ''}</span>
            <span class="review-score-badge ${scoreClass}">${scoreLabel} (+${grade.points}分)</span>
          </div>
          <p style="margin:10px 0;font-weight:500;">${q.stem}</p>
          ${optionsHTML}
          <div style="margin-top:10px;padding:10px;background:rgba(96,165,250,0.06);border-radius:6px;">
            <p style="font-size:0.78rem;color:var(--text-secondary);">${q.analysis || q.explanation || ''}</p>
          </div>
        </div>`;
    });

    container.innerHTML = `
      <div class="exam-review">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h2 style="font-family:var(--font-serif);font-size:1.2rem;">试卷解析</h2>
          <button class="btn btn-ghost btn-sm" id="btnBackReport">← 返回成绩单</button>
        </div>
        ${reviewHTML}
      </div>`;

    $('#btnBackReport', container)?.addEventListener('click', () => this._renderReport());
  }
};
