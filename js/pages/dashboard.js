/**
 * 法考通 · 学习面板页面
 */
import { $, html } from '../utils/dom.js';
import { daysUntil, percentage } from '../utils/helpers.js';
import { drawTrendLine, drawRadar, drawHeatmap } from '../utils/charts.js';
import { generateRecommendation } from '../recommend.js';

let store;
let subjects;
let questions;

export default {
  init(container, _store, data) {
    store = _store;
    subjects = data.subjects;
    questions = data.questions;
    this.render(container);
    // 延迟绘制 canvas（等待 DOM 渲染）
    requestAnimationFrame(() => this._drawCharts(container));
  },

  render(container) {
    const state = store.get();
    const examDate = state.settings.examDate;
    const days = daysUntil(examDate);
    const accuracy = percentage(state.stats.totalCorrect, state.stats.totalAnswered);
    const masteredCount = Object.values(state.cardStatus).filter(s => s === 'easy').length;
    const totalCards = Object.keys(state.cardStatus).length;

    let subjectProgressHTML = '';
    subjects.forEach(sub => {
      const subQs = questions.filter(q => q.subject === sub.id);
      const answered = state.subjectProgress[sub.id]?.answered || 0;
      const pct = subQs.length > 0 ? Math.round(answered / subQs.length * 100) : 0;
      subjectProgressHTML += `
        <div class="subject-item">
          <div class="subject-info">
            <div class="subject-dot" style="background:${sub.color}"></div>
            <span class="subject-name">${sub.name}</span>
          </div>
          <div class="subject-progress">
            <div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
          </div>
          <span class="subject-pct">${pct}%</span>
        </div>`;
    });

    // 智能推荐
    const { recommendations } = generateRecommendation(state, subjects, questions);
    let recommendHTML = '';
    if (recommendations.length > 0) {
      const items = recommendations.slice(0, 3).map(r => `
        <div class="recommend-item" data-nav="${r.action}">
          <span class="recommend-icon">${r.icon}</span>
          <div class="recommend-content">
            <div class="recommend-title">${r.title}</div>
            <div class="recommend-desc">${r.description}</div>
          </div>
          <span class="recommend-arrow">→</span>
        </div>`).join('');
      recommendHTML = `
      <div class="card animate-in recommend-card">
        <div class="card-title">💡 今日推荐</div>
        ${items}
      </div>`;
    }

    container.innerHTML = `
      <div class="dashboard-hero animate-in">
        <div class="hero-countdown">${days != null ? days : '--'}<span>天</span></div>
        <div class="hero-subtitle">距离法考客观题考试还有</div>
        <div class="hero-exam-date">&#128197; ${examDate ? '考试日期：' + examDate : '请先在设置中配置考试日期'}</div>
      </div>

      ${recommendHTML}

      <div class="stats-grid">
        <div class="stat-card animate-in">
          <div class="stat-label">已刷题数</div>
          <div class="stat-value">${state.stats.totalAnswered}</div>
          <div class="stat-sub">累计答题</div>
        </div>
        <div class="stat-card animate-in">
          <div class="stat-label">正确率</div>
          <div class="stat-value">${accuracy}%</div>
          <div class="stat-sub">正确 / 总数</div>
        </div>
        <div class="stat-card animate-in">
          <div class="stat-label">&#128293; 连续打卡</div>
          <div class="stat-value">${state.streak?.current || 0}<span style="font-size:0.5em;"> 天</span></div>
          <div class="stat-sub">最佳 ${state.streak?.best || 0} 天</div>
        </div>
        <div class="stat-card animate-in">
          <div class="stat-label">错题数</div>
          <div class="stat-value">${state.mistakes.length}</div>
          <div class="stat-sub">待复习</div>
        </div>
        <div class="stat-card animate-in">
          <div class="stat-label">掌握卡片</div>
          <div class="stat-value">${masteredCount}/${totalCards}</div>
          <div class="stat-sub">已标记掌握</div>
        </div>
      </div>

      <div class="dashboard-grid" style="grid-template-columns:1fr 1fr;">
        <div class="card animate-in">
          <div class="card-title">正确率趋势</div>
          <canvas id="chartTrend" style="width:100%;height:200px;"></canvas>
        </div>
        <div class="card animate-in">
          <div class="card-title">学科能力</div>
          <canvas id="chartRadar" style="width:100%;height:200px;"></canvas>
        </div>
      </div>

      <div class="card animate-in" style="margin-top:20px;">
        <div class="card-title">学习热力图</div>
        <canvas id="chartHeatmap" style="width:100%;height:150px;"></canvas>
      </div>

      <div class="dashboard-grid">
        <div class="card animate-in">
          <div class="card-title">学科进度</div>
          <div id="subjectProgressList">${subjectProgressHTML}</div>
        </div>
        <div class="card animate-in">
          <div class="card-title">快速开始</div>
          <div class="quick-actions">
            <div class="quick-action-item" data-nav="practice">
              <div class="quick-action-icon" style="background:rgba(212,168,75,0.12);color:var(--accent-gold);">&#9998;</div>
              <div class="quick-action-text">
                <h4>随机刷题</h4>
                <p>从题库中随机抽取 20 题</p>
              </div>
            </div>
            <div class="quick-action-item" data-nav="flashcards">
              <div class="quick-action-icon" style="background:rgba(167,139,250,0.12);color:var(--accent-purple);">&#9733;</div>
              <div class="quick-action-text">
                <h4>速记卡片</h4>
                <p>快速回顾核心考点</p>
              </div>
            </div>
            <div class="quick-action-item" data-nav="mistakes">
              <div class="quick-action-icon" style="background:rgba(224,82,82,0.12);color:var(--accent-red);">&#9888;</div>
              <div class="quick-action-text">
                <h4>复习错题</h4>
                <p>巩固薄弱知识点</p>
              </div>
            </div>
            <div class="quick-action-item" data-nav="knowledge">
              <div class="quick-action-icon" style="background:rgba(96,165,250,0.12);color:var(--accent-blue);">&#9776;</div>
              <div class="quick-action-text">
                <h4>知识体系</h4>
                <p>系统梳理学科框架</p>
              </div>
            </div>
            <div class="quick-action-item" data-nav="exam">
              <div class="quick-action-icon" style="background:rgba(239,68,68,0.12);color:var(--accent-red);">&#128203;</div>
              <div class="quick-action-text">
                <h4>模拟考试</h4>
                <p>限时模考，检验水平</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      ${this._renderExamHistory(state)}`;
  },

  _drawCharts(container) {
    const state = store.get();

    // 正确率趋势数据（从 dailyLog 获取）
    const dailyLog = state.dailyLog || {};
    const trendData = Object.entries(dailyLog)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30) // 最近 30 天
      .map(([date, log]) => ({
        date,
        rate: log.answered > 0 ? Math.round(log.correct / log.answered * 100) : 0,
      }));

    // 如果有数据，绘制趋势图
    const trendCanvas = $('#chartTrend', container);
    if (trendCanvas && trendData.length >= 2) {
      drawTrendLine(trendCanvas, trendData);
    }

    // 学科雷达图
    const radarCanvas = $('#chartRadar', container);
    if (radarCanvas) {
      const radarData = subjects.slice(0, 8).map(sub => {
        const progress = state.subjectProgress[sub.id];
        const score = progress && progress.answered > 0
          ? Math.round(progress.correct / progress.answered * 100)
          : 0;
        return { name: sub.name.slice(0, 3), score };
      });
      if (radarData.some(d => d.score > 0)) {
        drawRadar(radarCanvas, radarData);
      }
    }

    // 学习热力图
    const heatmapCanvas = $('#chartHeatmap', container);
    if (heatmapCanvas) {
      const heatmapData = {};
      Object.entries(dailyLog).forEach(([date, log]) => {
        heatmapData[date] = log.answered || 0;
      });
      drawHeatmap(heatmapCanvas, heatmapData, 12);
    }
  },

  _renderExamHistory(state) {
    const history = (state.examHistory || []).slice(-5).reverse();
    if (history.length === 0) return '';

    let rows = '';
    history.forEach(h => {
      const date = new Date(h.timestamp).toLocaleDateString('zh-CN');
      const passed = h.report.passed;
      rows += `
        <tr>
          <td>${h.config}</td>
          <td><strong style="color:${passed ? 'var(--accent-green)' : 'var(--accent-red)'};">${h.report.score}</strong> / ${h.report.totalScore}</td>
          <td>${passed ? '<span class="badge badge-green">通过</span>' : '<span class="badge badge-red">未通过</span>'}</td>
          <td style="color:var(--text-muted);font-size:0.72rem;">${date}</td>
        </tr>`;
    });

    return `
      <div class="card animate-in" style="margin-top:20px;">
        <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;">
          <span>模考历史</span>
          <button class="btn btn-ghost btn-sm" data-nav="exam">更多 →</button>
        </div>
        <table class="exam-report-table">
          <thead><tr><th>类型</th><th>得分</th><th>结果</th><th>日期</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  },

  destroy() {}
};

