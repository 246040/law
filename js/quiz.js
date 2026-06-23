/**
 * 法考通关助手 - 做题模块
 */

const Quiz = {
  currentQuestions: [],
  currentIndex: 0,
  selectedOption: null,
  submitted: false,
  sessionCorrect: 0,
  sessionTotal: 0,

  // 初始化做题，传入题目ID数组
  start(questionIds) {
    this.currentQuestions = questionIds.map(id => QUESTIONS.find(q => q.id === id)).filter(Boolean);
    this.currentIndex = 0;
    this.selectedOption = null;
    this.submitted = false;
    this.sessionCorrect = 0;
    this.sessionTotal = 0;
    this.render();
  },

  // 开始所有题
  startAll() {
    this.start(QUESTIONS.map(q => q.id));
  },

  // 开始某个topic的题
  startTopic(topicQuestionIds) {
    this.start(topicQuestionIds);
  },

  // 开始错题重做
  startWrongBook() {
    const wrongBook = Store.getActiveWrongBook();
    if (wrongBook.length === 0) {
      this.renderEmpty();
      return;
    }
    this.start(wrongBook.map(w => w.questionId));
  },

  // 渲染当前题目
  render() {
    const page = document.getElementById('page-quiz');
    if (!page) return;

    if (this.currentQuestions.length === 0) {
      this.renderEmpty();
      return;
    }

    const question = this.currentQuestions[this.currentIndex];
    if (!question) {
      this.renderScoreCard();
      return;
    }

    const progress = ((this.currentIndex) / this.currentQuestions.length) * 100;

    page.innerHTML = `
      <div class="quiz-header flex-between mb-md">
        <button class="btn btn-ghost btn-sm" onclick="App.navigate('library')">← 返回</button>
        <span class="badge badge-gold">${this.currentIndex + 1} / ${this.currentQuestions.length}</span>
      </div>

      <div class="progress-bar mb-lg">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>

      <div class="card animate-in">
        <div class="flex-between mb-sm">
          <span class="tag">${question.category} · ${question.subcategory}</span>
          <span class="tag">难度 ${'★'.repeat(question.difficulty)}${'☆'.repeat(5 - question.difficulty)}</span>
        </div>

        <div class="question-stem mb-lg" style="font-size: var(--text-lg); line-height: 1.8; white-space: pre-wrap;">${question.stem}</div>

        <div class="option-list" id="option-list">
          ${question.options.map((opt, idx) => `
            <div class="option-item" data-index="${idx}" onclick="Quiz.selectOption(${idx})">
              <span class="option-label">${String.fromCharCode(65 + idx)}</span>
              <span class="option-text">${opt.substring(3)}</span>
            </div>
          `).join('')}
        </div>

        <div class="mt-lg" id="submit-area">
          <button class="btn btn-primary btn-block btn-lg" id="btn-submit" onclick="Quiz.submit()" disabled>
            确认提交
          </button>
        </div>

        <div id="analysis-area"></div>
      </div>

      <div class="flex-between mt-lg" id="nav-area" style="display:none;">
        <button class="btn btn-secondary" onclick="Quiz.prev()" ${this.currentIndex === 0 ? 'disabled' : ''}>
          ← 上一题
        </button>
        <button class="btn btn-primary" onclick="Quiz.next()">
          ${this.currentIndex === this.currentQuestions.length - 1 ? '查看成绩' : '下一题 →'}
        </button>
      </div>
    `;
  },

  selectOption(idx) {
    if (this.submitted) return;

    this.selectedOption = idx;
    const items = document.querySelectorAll('.option-item');
    items.forEach((item, i) => {
      item.classList.toggle('selected', i === idx);
    });

    const btn = document.getElementById('btn-submit');
    if (btn) btn.disabled = false;
  },

  submit() {
    if (this.selectedOption === null || this.submitted) return;
    this.submitted = true;

    const question = this.currentQuestions[this.currentIndex];
    const correctIdx = question.answer.charCodeAt(0) - 65;
    const isCorrect = this.selectedOption === correctIdx;

    this.sessionTotal++;
    if (isCorrect) this.sessionCorrect++;

    // 标记选项
    const items = document.querySelectorAll('.option-item');
    items.forEach((item, i) => {
      item.classList.add('disabled');
      if (i === correctIdx) {
        item.classList.add('correct');
      }
      if (i === this.selectedOption && !isCorrect) {
        item.classList.add('wrong');
      }
    });

    // 记录历史
    Store.addHistory({
      questionId: question.id,
      category: question.category,
      userAnswer: String.fromCharCode(65 + this.selectedOption),
      correct: isCorrect,
      timeSpent: 0
    });

    // 错题处理
    if (!isCorrect) {
      Store.addToWrongBook(question.id, String.fromCharCode(65 + this.selectedOption));
    } else {
      Store.markCorrectInWrongBook(question.id);
    }

    // 隐藏提交按钮
    const submitArea = document.getElementById('submit-area');
    if (submitArea) submitArea.style.display = 'none';

    // 显示解析
    const analysisArea = document.getElementById('analysis-area');
    if (analysisArea) {
      analysisArea.innerHTML = `
        <div class="analysis-panel">
          <h4>${isCorrect ? '✓ 回答正确' : '✗ 回答错误'}</h4>

          <div class="analysis-section">
            <div class="label">📖 解析</div>
            <div class="content">${question.analysis}</div>
          </div>

          <div class="analysis-section">
            <div class="label">⚠️ 陷阱提醒</div>
            <div class="content">${question.trap}</div>
          </div>

          <div class="analysis-section">
            <div class="label">📐 判断规则</div>
            <div class="content">${question.rule}</div>
          </div>

          <div class="analysis-section">
            <div class="label">📜 法条依据</div>
            <div class="content"><span class="law-ref">${question.lawRef}</span></div>
          </div>

          <div class="mt-md">
            ${question.tags.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
        </div>
      `;
    }

    // 显示导航
    const navArea = document.getElementById('nav-area');
    if (navArea) navArea.style.display = 'flex';
  },

  next() {
    this.currentIndex++;
    this.selectedOption = null;
    this.submitted = false;

    if (this.currentIndex >= this.currentQuestions.length) {
      this.renderScoreCard();
    } else {
      this.render();
    }
  },

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.selectedOption = null;
      this.submitted = false;
      this.render();
    }
  },

  renderScoreCard() {
    const page = document.getElementById('page-quiz');
    const rate = this.sessionTotal > 0
      ? Math.round((this.sessionCorrect / this.sessionTotal) * 100)
      : 0;

    let verdict = '';
    if (rate >= 80) verdict = '🎉 优秀！规则识别能力很强';
    else if (rate >= 60) verdict = '👍 不错，继续巩固高频考点';
    else verdict = '💪 需要强化练习，注意判断树';

    page.innerHTML = `
      <div class="card score-card animate-in">
        <div class="score-value">${rate}%</div>
        <div class="score-label">本轮正确率</div>

        <div class="stat-grid mt-lg">
          <div class="stat-card">
            <div class="stat-value text-correct">${this.sessionCorrect}</div>
            <div class="stat-label">答对</div>
          </div>
          <div class="stat-card">
            <div class="stat-value text-wrong">${this.sessionTotal - this.sessionCorrect}</div>
            <div class="stat-label">答错</div>
          </div>
        </div>

        <p class="mt-lg" style="font-size: var(--text-lg); color: var(--text-secondary);">${verdict}</p>

        <div class="mt-lg" style="display:flex; flex-direction:column; gap: var(--space-sm);">
          <button class="btn btn-primary btn-block" onclick="Quiz.startAll()">再做一轮</button>
          <button class="btn btn-secondary btn-block" onclick="Quiz.startWrongBook()">重做错题</button>
          <button class="btn btn-ghost btn-block" onclick="App.navigate('home')">返回首页</button>
        </div>
      </div>
    `;
  },

  renderEmpty() {
    const page = document.getElementById('page-quiz');
    page.innerHTML = `
      <div class="empty-state">
        <div class="icon">📚</div>
        <div class="message">暂无题目</div>
        <button class="btn btn-primary" onclick="App.navigate('library')">去题库选择</button>
      </div>
    `;
  }
};
