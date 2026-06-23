/**
 * 法考通 · 学习面板页面
 */
import { $, html } from '../utils/dom.js';
import { daysUntil, percentage } from '../utils/helpers.js';

let store;
let subjects;
let questions;

export default {
  init(container, _store, data) {
    store = _store;
    subjects = data.subjects;
    questions = data.questions;
    this.render(container);
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

    container.innerHTML = `
      <div class="dashboard-hero animate-in">
        <div class="hero-countdown">${days != null ? days : '--'}<span>天</span></div>
        <div class="hero-subtitle">距离法考客观题考试还有</div>
        <div class="hero-exam-date">&#128197; ${examDate ? '考试日期：' + examDate : '请先在设置中配置考试日期'}</div>
      </div>

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
          </div>
        </div>
      </div>`;
  },

  destroy() {}
};
