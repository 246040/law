/**
 * 法考通关助手 - 统计模块
 */

const Stats = {
  render() {
    const page = document.getElementById('page-stats');
    if (!page) return;

    const stats = Store.getStats();
    const today = Store.getTodayStats();
    const wrongBook = Store.getActiveWrongBook();

    page.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">📊 学习统计</h1>
        <p class="page-subtitle">数据驱动，精准提分</p>
      </div>

      <!-- 今日数据 -->
      <div class="card mb-md animate-in">
        <h3 style="color: var(--accent-gold); margin-bottom: var(--space-md);">📅 今日数据</h3>
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
      </div>

      <!-- 总体数据 -->
      <div class="card mb-md animate-in">
        <h3 style="color: var(--accent-gold); margin-bottom: var(--space-md);">📈 总体数据</h3>
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
            <div class="stat-value">${wrongBook.length}</div>
            <div class="stat-label">待复习</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.streak}</div>
            <div class="stat-label">连对</div>
          </div>
        </div>
      </div>

      <!-- 近7天趋势 -->
      <div class="card mb-md animate-in">
        <h3 style="color: var(--accent-gold); margin-bottom: var(--space-md);">📉 近7天趋势</h3>
        <div id="trend-chart"></div>
      </div>

      <!-- 分科统计 -->
      <div class="card mb-md animate-in">
        <h3 style="color: var(--accent-gold); margin-bottom: var(--space-md);">📚 分科统计</h3>
        <div id="category-stats">
          ${Object.keys(stats.byCategory).length > 0
            ? Object.entries(stats.byCategory).map(([cat, data]) => {
              const rate = data.done > 0 ? Math.round((data.correct / data.done) * 100) : 0;
              return `
                <div class="flex-between mb-md">
                  <div>
                    <span style="font-weight: 600;">${cat}</span>
                    <span style="color: var(--text-muted); font-size: var(--text-sm);"> ${data.done}题</span>
                  </div>
                  <div class="flex gap-sm" style="align-items: center;">
                    <div class="progress-bar" style="width: 100px;">
                      <div class="progress-fill" style="width: ${rate}%; background: ${rate >= 70 ? 'var(--color-correct)' : rate >= 50 ? 'var(--accent-gold)' : 'var(--color-wrong)'}"></div>
                    </div>
                    <span style="font-weight: 700; min-width: 40px; text-align: right; color: ${rate >= 70 ? 'var(--color-correct)' : rate >= 50 ? 'var(--accent-gold)' : 'var(--color-wrong)'};">${rate}%</span>
                  </div>
                </div>
              `;
            }).join('')
            : '<p style="color: var(--text-muted);">暂无数据，先去做几道题吧</p>'
          }
        </div>
      </div>

      <!-- 错误类型分析 -->
      <div class="card animate-in">
        <h3 style="color: var(--accent-gold); margin-bottom: var(--space-md);">🔍 高频错题标签</h3>
        <div id="error-tags">
          ${this.renderErrorTags()}
        </div>
      </div>
    `;

    this.renderTrendChart(stats.byDate);
  },

  renderTrendChart(byDate) {
    const container = document.getElementById('trend-chart');
    if (!container || !byDate) return;

    const dates = Object.keys(byDate).sort();
    if (dates.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted);">暂无数据</p>';
      return;
    }

    const maxDone = Math.max(...dates.map(d => byDate[d].done), 1);

    container.innerHTML = `
      <div style="display: flex; align-items: flex-end; gap: 4px; height: 120px; padding: 0 4px;">
        ${dates.map(date => {
          const data = byDate[date];
          const height = (data.done / maxDone) * 100;
          const rate = data.done > 0 ? Math.round((data.correct / data.done) * 100) : 0;
          const color = data.done === 0 ? 'var(--bg-tertiary)' : rate >= 70 ? 'var(--color-correct)' : rate >= 50 ? 'var(--accent-gold)' : 'var(--color-wrong)';
          const day = date.split('-')[2];
          return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <span style="font-size: 10px; color: var(--text-muted);">${data.done || ''}</span>
              <div style="width: 100%; height: ${Math.max(height, 4)}%; background: ${color}; border-radius: 4px 4px 0 0; transition: height 0.3s ease;"></div>
              <span style="font-size: 10px; color: var(--text-muted);">${day}日</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderErrorTags() {
    const wrongBook = Store.getWrongBook();
    if (wrongBook.length === 0) return '<p style="color: var(--text-muted);">暂无错题</p>';

    const tagCount = {};
    wrongBook.forEach(w => {
      const q = QUESTIONS.find(q => q.id === w.questionId);
      if (q && q.tags) {
        q.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + w.wrongCount;
        });
      }
    });

    const sorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1]);

    return sorted.map(([tag, count]) => `
      <span class="tag" style="font-size: var(--text-sm); padding: 4px 12px; margin: 2px;">
        ${tag} <span style="color: var(--color-wrong);">×${count}</span>
      </span>
    `).join('');
  }
};
