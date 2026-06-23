/**
 * 法考通关助手 - 错题本模块
 */

const WrongBook = {
  currentFilter: 'all',

  render() {
    const page = document.getElementById('page-wrongbook');
    if (!page) return;

    const wrongItems = Store.getWrongBook();
    const activeItems = wrongItems.filter(w => !w.mastered);
    const masteredItems = wrongItems.filter(w => w.mastered);

    if (wrongItems.length === 0) {
      page.innerHTML = `
        <div class="page-header">
          <h1 class="page-title">📕 错题本</h1>
          <p class="page-subtitle">做错的题目会自动收录到这里</p>
        </div>
        <div class="empty-state">
          <div class="icon">🎯</div>
          <div class="message">还没有错题，继续保持！</div>
          <button class="btn btn-primary mt-md" onclick="App.navigate('library')">去做题</button>
        </div>
      `;
      return;
    }

    // 获取分类
    const categories = new Set();
    activeItems.forEach(w => {
      const q = QUESTIONS.find(q => q.id === w.questionId);
      if (q) categories.add(q.category);
    });

    page.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">📕 错题本</h1>
        <p class="page-subtitle">
          待复习 <span class="badge badge-wrong">${activeItems.length}</span>
          已掌握 <span class="badge badge-correct">${masteredItems.length}</span>
        </p>
      </div>

      <div class="flex gap-sm mb-lg" style="flex-wrap: wrap;">
        <button class="btn ${this.currentFilter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm"
                onclick="WrongBook.filter('all')">全部</button>
        ${[...categories].map(cat => `
          <button class="btn ${this.currentFilter === cat ? 'btn-primary' : 'btn-secondary'} btn-sm"
                  onclick="WrongBook.filter('${cat}')">${cat}</button>
        `).join('')}
      </div>

      ${activeItems.length > 0 ? `
        <button class="btn btn-primary btn-block mb-lg" onclick="WrongBook.startReview()">
          🔄 重做错题（${activeItems.length}题）
        </button>
      ` : ''}

      <div class="wrong-list">
        ${activeItems
          .filter(w => {
            if (this.currentFilter === 'all') return true;
            const q = QUESTIONS.find(q => q.id === w.questionId);
            return q && q.category === this.currentFilter;
          })
          .map(w => {
            const q = QUESTIONS.find(q => q.id === w.questionId);
            if (!q) return '';
            return `
              <div class="wrong-item animate-in">
                <div class="stem-preview">${q.stem.split('\n')[0]}</div>
                <div class="meta">
                  <span>❌ 错 ${w.wrongCount} 次</span>
                  <span>✅ 连对 ${w.correctStreak} 次</span>
                  <span>${q.category} · ${q.subcategory}</span>
                </div>
                <div class="mt-sm flex gap-sm">
                  <button class="btn btn-ghost btn-sm" onclick="WrongBook.reviewOne('${q.id}')">重做</button>
                  <button class="btn btn-ghost btn-sm" onclick="WrongBook.remove('${q.id}')">移出</button>
                </div>
              </div>
            `;
          }).join('')}
      </div>

      ${masteredItems.length > 0 ? `
        <div class="mt-lg">
          <h3 style="color: var(--text-muted); font-size: var(--text-sm); margin-bottom: var(--space-sm);">
            ✅ 已掌握（连续答对3次）
          </h3>
          ${masteredItems.map(w => {
            const q = QUESTIONS.find(q => q.id === w.questionId);
            if (!q) return '';
            return `
              <div class="wrong-item" style="opacity: 0.5;">
                <div class="stem-preview">${q.stem.split('\n')[0]}</div>
                <div class="meta">
                  <span class="badge badge-correct">已掌握</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    `;
  },

  filter(category) {
    this.currentFilter = category;
    this.render();
  },

  startReview() {
    const activeItems = Store.getActiveWrongBook();
    Quiz.start(activeItems.map(w => w.questionId));
    App.navigate('quiz');
  },

  reviewOne(questionId) {
    Quiz.start([questionId]);
    App.navigate('quiz');
  },

  remove(questionId) {
    Store.removeFromWrongBook(questionId);
    this.render();
  }
};
