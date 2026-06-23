/**
 * 法考通关助手 - 限时模拟模式
 * 模拟法考客观题实战环境
 */

const Exam = {
  questions: [],
  answers: {},        // { questionId: selectedIndex }
  currentIndex: 0,
  timeLimit: 0,       // 秒
  timeRemaining: 0,
  timerInterval: null,
  started: false,
  finished: false,

  // 开始模拟考试
  start(questionIds, timeLimitMinutes) {
    this.questions = questionIds.map(id => QUESTIONS.find(q => q.id === id)).filter(Boolean);
    this.answers = {};
    this.currentIndex = 0;
    this.timeLimit = timeLimitMinutes * 60;
    this.timeRemaining = this.timeLimit;
    this.started = true;
    this.finished = false;

    this.startTimer();
    this.render();
  },

  // 快速模拟（全部题目，每题2分钟）
  startQuick() {
    const allIds = QUESTIONS.map(q => q.id);
    this.start(allIds, allIds.length * 2);
  },

  // 自定义模拟
  startCustom(questionIds, minutes) {
    this.start(questionIds, minutes);
  },

  // 计时器
  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();

      if (this.timeRemaining <= 0) {
        this.autoSubmit();
      }
    }, 1000);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  updateTimerDisplay() {
    const el = document.getElementById('exam-timer');
    if (!el) return;

    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    el.textContent = timeStr;

    // 最后5分钟变红
    if (this.timeRemaining <= 300) {
      el.style.color = 'var(--color-wrong)';
      el.style.animation = 'correctPulse 1s infinite';
    } else {
      el.style.color = 'var(--accent-gold)';
      el.style.animation = 'none';
    }
  },

  // 自动交卷
  autoSubmit() {
    this.stopTimer();
    this.finished = true;
    this.renderResult();
  },

  // 手动交卷
  manualSubmit() {
    const unanswered = this.questions.length - Object.keys(this.answers).length;
    if (unanswered > 0) {
      const confirm = window.confirm(`还有 ${unanswered} 题未作答，确定交卷吗？`);
      if (!confirm) return;
    }
    this.stopTimer();
    this.finished = true;
    this.renderResult();
  },

  // 选择答案
  selectAnswer(idx) {
    if (this.finished) return;
    const question = this.questions[this.currentIndex];
    this.answers[question.id] = idx;
    this.render();
  },

  // 跳转题目
  goTo(index) {
    if (index >= 0 && index < this.questions.length) {
      this.currentIndex = index;
      this.render();
    }
  },

  // 渲染模拟考试界面
  render() {
    const page = document.getElementById('page-quiz');
    if (!page) return;

    if (!this.started || this.questions.length === 0) {
      this.renderSetup();
      return;
    }

    if (this.finished) {
      this.renderResult();
      return;
    }

    const question = this.questions[this.currentIndex];
    const selectedIdx = this.answers[question.id];
    const answered = Object.keys(this.answers).length;

    page.innerHTML = `
      <!-- 考试顶栏 -->
      <div class="exam-topbar">
        <div class="flex-between mb-sm">
          <span class="badge badge-wrong" style="font-size: var(--text-sm);">⏱ 限时模拟</span>
          <span id="exam-timer" style="font-size: var(--text-xl); font-weight: 800; font-family: var(--font-mono); color: var(--accent-gold);">
            ${this.formatTime(this.timeRemaining)}
          </span>
        </div>
        <div class="flex-between">
          <span style="font-size: var(--text-xs); color: var(--text-muted);">
            已答 ${answered}/${this.questions.length}
          </span>
          <button class="btn btn-sm btn-secondary" onclick="Exam.manualSubmit()" style="color: var(--color-wrong);">
            交卷
          </button>
        </div>
        <div class="progress-bar mt-sm">
          <div class="progress-fill" style="width: ${(answered / this.questions.length) * 100}%"></div>
        </div>
      </div>

      <!-- 题目导航 -->
      <div class="exam-nav mt-md mb-md" style="display: flex; flex-wrap: wrap; gap: 4px;">
        ${this.questions.map((q, i) => {
          let cls = 'exam-nav-btn';
          if (i === this.currentIndex) cls += ' current';
          if (this.answers[q.id] !== undefined) cls += ' answered';
          return `<button class="${cls}" onclick="Exam.goTo(${i})">${i + 1}</button>`;
        }).join('')}
      </div>

      <!-- 题目内容 -->
      <div class="card animate-in">
        <div class="flex-between mb-sm">
          <span class="tag">${question.category} · ${question.subcategory}</span>
          <span style="color: var(--text-muted); font-size: var(--text-sm);">第 ${this.currentIndex + 1} 题</span>
        </div>

        <div class="question-stem mb-lg" style="font-size: var(--text-lg); line-height: 1.8; white-space: pre-wrap;">${question.stem}</div>

        <div class="option-list">
          ${question.options.map((opt, idx) => `
            <div class="option-item ${selectedIdx === idx ? 'selected' : ''}" onclick="Exam.selectAnswer(${idx})">
              <span class="option-label">${String.fromCharCode(65 + idx)}</span>
              <span class="option-text">${opt.substring(3)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 上下题 -->
      <div class="flex-between mt-lg">
        <button class="btn btn-secondary" onclick="Exam.goTo(${this.currentIndex - 1})" ${this.currentIndex === 0 ? 'disabled' : ''}>
          ← 上一题
        </button>
        <button class="btn btn-primary" onclick="Exam.goTo(${this.currentIndex + 1})" ${this.currentIndex === this.questions.length - 1 ? 'disabled' : ''}>
          下一题 →
        </button>
      </div>
    `;

    this.updateTimerDisplay();
  },

  // 渲染考试设置页
  renderSetup() {
    const page = document.getElementById('page-quiz');
    if (!page) return;

    const totalQuestions = QUESTIONS.length;

    page.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">⏱ 限时模拟</h1>
        <p class="page-subtitle">模拟法考实战环境，计时作答，交卷后统一判分</p>
      </div>

      <div class="card mb-md animate-in">
        <h3 style="color: var(--accent-gold); margin-bottom: var(--space-md);">模拟规则</h3>
        <ul style="color: var(--text-secondary); font-size: var(--text-sm); line-height: 2; padding-left: var(--space-lg);">
          <li>计时作答，倒计时结束自动交卷</li>
          <li>作答过程中<strong>不显示解析</strong></li>
          <li>可跳题，可修改已选答案</li>
          <li>交卷后统一判分，显示详细解析</li>
        </ul>
      </div>

      <div class="card mb-md animate-in">
        <h3 style="color: var(--accent-gold); margin-bottom: var(--space-md);">选择模式</h3>

        <div style="display: flex; flex-direction: column; gap: var(--space-md);">
          <button class="btn btn-primary btn-block btn-lg" onclick="Exam.startQuick()">
            🎯 快速模拟（全部${totalQuestions}题 · ${totalQuestions * 2}分钟）
          </button>

          <div style="border-top: 1px solid var(--border-color); padding-top: var(--space-md);">
            <p style="color: var(--text-muted); font-size: var(--text-sm); margin-bottom: var(--space-sm);">自定义模拟</p>
            <div style="display: flex; gap: var(--space-sm); align-items: center; flex-wrap: wrap;">
              <select id="exam-category" style="flex:1; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-primary); font-size: var(--text-sm);">
                <option value="all">全部题目</option>
                <option value="财产犯罪">财产犯罪</option>
                <option value="共同犯罪">共同犯罪</option>
              </select>
              <input id="exam-time" type="number" value="20" min="5" max="180" 
                     style="width: 70px; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-primary); font-size: var(--text-sm);"
              />
              <span style="color: var(--text-muted); font-size: var(--text-sm);">分钟</span>
            </div>
            <button class="btn btn-secondary btn-block mt-md" onclick="Exam.startFromSetup()">
              开始自定义模拟
            </button>
          </div>
        </div>
      </div>

      <button class="btn btn-ghost btn-block" onclick="App.navigate('home')">← 返回首页</button>
    `;
  },

  startFromSetup() {
    const categoryEl = document.getElementById('exam-category');
    const timeEl = document.getElementById('exam-time');
    const category = categoryEl ? categoryEl.value : 'all';
    const minutes = timeEl ? parseInt(timeEl.value) || 20 : 20;

    let ids;
    if (category === 'all') {
      ids = QUESTIONS.map(q => q.id);
    } else {
      ids = QUESTIONS.filter(q => q.subcategory === category).map(q => q.id);
    }

    if (ids.length === 0) {
      alert('该分类暂无题目');
      return;
    }

    // 随机打乱
    ids = ids.sort(() => Math.random() - 0.5);
    this.start(ids, minutes);
    App.navigate('quiz');
  },

  // 渲染考试结果
  renderResult() {
    const page = document.getElementById('page-quiz');
    if (!page) return;

    let correct = 0;
    let wrong = 0;
    let unanswered = 0;
    const details = [];

    this.questions.forEach((q, i) => {
      const userIdx = this.answers[q.id];
      const correctIdx = q.answer.charCodeAt(0) - 65;

      if (userIdx === undefined) {
        unanswered++;
        details.push({ question: q, userAnswer: null, isCorrect: false, index: i });
      } else if (userIdx === correctIdx) {
        correct++;
        details.push({ question: q, userAnswer: String.fromCharCode(65 + userIdx), isCorrect: true, index: i });
        // 记录历史
        Store.addHistory({ questionId: q.id, category: q.category, userAnswer: String.fromCharCode(65 + userIdx), correct: true, timeSpent: 0 });
      } else {
        wrong++;
        details.push({ question: q, userAnswer: String.fromCharCode(65 + userIdx), isCorrect: false, index: i });
        Store.addHistory({ questionId: q.id, category: q.category, userAnswer: String.fromCharCode(65 + userIdx), correct: false, timeSpent: 0 });
        Store.addToWrongBook(q.id, String.fromCharCode(65 + userIdx));
      }
    });

    const rate = Math.round((correct / this.questions.length) * 100);
    const timeUsed = this.timeLimit - this.timeRemaining;

    let verdict = '';
    if (rate >= 80) verdict = '🎉 优秀！考试状态很好';
    else if (rate >= 60) verdict = '👍 及格线以上，继续冲刺';
    else verdict = '💪 还需要更多练习';

    page.innerHTML = `
      <div class="card score-card animate-in">
        <div class="badge badge-wrong mb-md" style="font-size: var(--text-sm);">⏱ 模拟考试结束</div>
        <div class="score-value">${rate}%</div>
        <div class="score-label">得分率</div>

        <div class="stat-grid mt-lg">
          <div class="stat-card">
            <div class="stat-value text-correct">${correct}</div>
            <div class="stat-label">正确</div>
          </div>
          <div class="stat-card">
            <div class="stat-value text-wrong">${wrong}</div>
            <div class="stat-label">错误</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: var(--text-muted);">${unanswered}</div>
            <div class="stat-label">未答</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.formatTime(timeUsed)}</div>
            <div class="stat-label">用时</div>
          </div>
        </div>

        <p class="mt-lg" style="font-size: var(--text-lg); color: var(--text-secondary);">${verdict}</p>
      </div>

      <!-- 逐题解析 -->
      <div class="mt-lg">
        <h3 style="color: var(--accent-gold); margin-bottom: var(--space-md);">📋 逐题解析</h3>
        ${details.map((d, i) => `
          <div class="card mb-sm" style="border-left: 4px solid ${d.isCorrect ? 'var(--color-correct)' : d.userAnswer === null ? 'var(--text-muted)' : 'var(--color-wrong)'};">
            <div class="flex-between mb-sm">
              <span style="font-weight: 700;">第 ${i + 1} 题</span>
              <span class="badge ${d.isCorrect ? 'badge-correct' : 'badge-wrong'}">
                ${d.isCorrect ? '✓ 正确' : d.userAnswer === null ? '— 未答' : '✗ 错误'}
              </span>
            </div>
            <div style="font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-sm);">
              ${d.question.stem.split('\n')[0].substring(0, 60)}...
            </div>
            <div style="font-size: var(--text-xs); color: var(--text-muted);">
              ${d.userAnswer ? `你选: ${d.userAnswer}` : '未作答'} | 正确答案: ${d.question.answer}
            </div>
            <details style="margin-top: var(--space-sm);">
              <summary style="cursor: pointer; font-size: var(--text-sm); color: var(--accent-gold);">查看解析</summary>
              <div class="analysis-panel" style="margin-top: var(--space-sm);">
                <div class="analysis-section">
                  <div class="label">📖 解析</div>
                  <div class="content">${d.question.analysis}</div>
                </div>
                <div class="analysis-section">
                  <div class="label">⚠️ 陷阱</div>
                  <div class="content">${d.question.trap}</div>
                </div>
                <div class="analysis-section">
                  <div class="label">📐 规则</div>
                  <div class="content">${d.question.rule}</div>
                </div>
              </div>
            </details>
          </div>
        `).join('')}
      </div>

      <div class="mt-lg" style="display:flex; flex-direction:column; gap: var(--space-sm);">
        <button class="btn btn-primary btn-block" onclick="Exam.renderSetup(); Exam.started=false;">再来一次</button>
        <button class="btn btn-secondary btn-block" onclick="App.navigate('wrongbook')">查看错题本</button>
        <button class="btn btn-ghost btn-block" onclick="App.navigate('home')">返回首页</button>
      </div>
    `;

    // 重置状态
    this.started = false;
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
};
