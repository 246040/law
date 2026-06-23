/**
 * 法考通关助手 - 主应用控制器
 * 路由管理、页面切换、全局初始化
 */

const App = {
  currentPage: 'home',

  init() {
    // 初始化主题
    const theme = Store.getTheme();
    document.documentElement.setAttribute('data-theme', theme);

    // 监听路由变化
    window.addEventListener('hashchange', () => this.handleRoute());

    // 初始路由
    this.handleRoute();

    // 更新统计
    Store.updateStats();
  },

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'home';
    this.navigate(hash, false);
  },

  navigate(page, updateHash = true) {
    this.currentPage = page;

    // 更新 hash
    if (updateHash) {
      window.location.hash = page;
    }

    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // 显示目标页面
    const target = document.getElementById(`page-${page}`);
    if (target) {
      target.classList.add('active');
    }

    // 更新导航高亮
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // 渲染页面内容
    this.renderPage(page);
  },

  renderPage(page) {
    switch (page) {
      case 'home':
        this.renderHome();
        break;
      case 'library':
        this.renderLibrary();
        break;
      case 'quiz':
        // quiz 由 Quiz 模块自己渲染
        break;
      case 'wrongbook':
        WrongBook.render();
        break;
      case 'stats':
        Stats.render();
        break;
      case 'exam':
        Exam.renderSetup();
        break;
      case 'tree':
        Tree.render();
        break;
    }
  },

  renderHome() {
    const page = document.getElementById('page-home');
    if (!page) return;

    const today = Store.getTodayStats();
    const stats = Store.getStats();
    const wrongCount = Store.getActiveWrongBook().length;

    page.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">⚖️ 法考通关助手</h1>
        <p class="page-subtitle">工程化备考，用判断树攻克法考</p>
      </div>

      <!-- 今日进度 -->
      <div class="card card-highlight mb-md animate-in">
        <div class="flex-between mb-md">
          <h3 style="color: var(--accent-gold);">📅 今日进度</h3>
          <span class="badge badge-gold">Day ${this.getDayCount()}</span>
        </div>
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-value">${today.done}</div>
            <div class="stat-label">做题数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${today.rate}%</div>
            <div class="stat-label">正确率</div>
          </div>
        </div>
        <div class="progress-bar mt-md">
          <div class="progress-fill" style="width: ${Math.min((today.done / 30) * 100, 100)}%"></div>
        </div>
        <div class="progress-text">今日目标：${today.done}/30 题</div>
      </div>

      <!-- 快速操作 -->
      <div class="card mb-md animate-in">
        <h3 style="color: var(--accent-gold); margin-bottom: var(--space-md);">🚀 快速开始</h3>
        <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
          <button class="btn btn-primary btn-block" onclick="App.quickStart()">
            📝 开始练习（全部${QUESTIONS.length}题）
          </button>
          <button class="btn btn-secondary btn-block" onclick="App.navigate('exam')">
            ⏱ 限时模拟
          </button>
          ${wrongCount > 0 ? `
            <button class="btn btn-secondary btn-block" onclick="App.quickWrongBook()">
              🔄 重做错题（${wrongCount}题）
            </button>
          ` : ''}
          <button class="btn btn-ghost btn-block" onclick="App.navigate('tree')">
            🌳 查看判断树
          </button>
        </div>
      </div>

      <!-- 总体概览 -->
      <div class="card animate-in">
        <h3 style="color: var(--accent-gold); margin-bottom: var(--space-md);">📊 学习概览</h3>
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.totalDone}</div>
            <div class="stat-label">总做题</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.correctRate}%</div>
            <div class="stat-label">正确率</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${wrongCount}</div>
            <div class="stat-label">错题</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.streak}</div>
            <div class="stat-label">连对</div>
          </div>
        </div>
      </div>
    `;
  },

  renderLibrary() {
    const page = document.getElementById('page-library');
    if (!page) return;

    const history = Store.getHistory();

    page.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">📚 题库</h1>
        <p class="page-subtitle">选择章节开始练习</p>
      </div>

      <div class="category-list animate-in">
        ${QUESTION_INDEX.categories.map(cat => `
          <div class="card mb-sm">
            <h3 style="color: var(--accent-gold); margin-bottom: var(--space-md);">${cat.name}</h3>
            ${cat.subcategories.map(sub => `
              <div style="margin-bottom: var(--space-md);">
                <h4 style="color: var(--text-secondary); font-size: var(--text-sm); margin-bottom: var(--space-sm);">${sub.name}</h4>
                <div class="category-list">
                  ${sub.topics.map(topic => {
                    const done = topic.questionIds.filter(id =>
                      history.some(h => h.questionId === id)
                    ).length;
                    return `
                      <div class="category-item" onclick="App.startTopic(${JSON.stringify(topic.questionIds)})">
                        <div>
                          <span class="category-name">${topic.name}</span>
                          <span style="color: var(--text-muted); font-size: var(--text-xs); margin-left: 8px;">
                            ${done}/${topic.questionIds.length} 已做
                          </span>
                        </div>
                        <span class="category-count">${topic.questionIds.length}题</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>

      <div class="card mt-lg animate-in">
        <button class="btn btn-primary btn-block" onclick="App.quickStart()">
          📝 全部题目一起练（${QUESTIONS.length}题）
        </button>
      </div>
    `;
  },

  quickStart() {
    Quiz.startAll();
    this.navigate('quiz');
  },

  quickWrongBook() {
    Quiz.startWrongBook();
    this.navigate('quiz');
  },

  startTopic(questionIds) {
    Quiz.startTopic(questionIds);
    this.navigate('quiz');
  },

  toggleTheme() {
    const current = Store.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    Store.setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    const btn = document.querySelector('.theme-toggle');
    if (btn) btn.textContent = next === 'dark' ? '🌙' : '☀️';
  },

  getDayCount() {
    const history = Store.getHistory();
    if (history.length === 0) return 1;
    const dates = new Set(history.map(h => h.timestamp.split('T')[0]));
    return dates.size || 1;
  }
};

// 启动应用
document.addEventListener('DOMContentLoaded', () => App.init());
