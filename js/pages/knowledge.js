/**
 * 法考通 · 知识体系页面
 */
import { $ } from '../utils/dom.js';

let store, subjects, knowledge, container;

export default {
  init(_container, _store, data) {
    store = _store;
    subjects = data.subjects;
    knowledge = data.knowledge;
    container = _container;
    this.render();
  },

  render() {
    let gridHTML = '';
    Object.entries(knowledge).forEach(([id, data]) => {
      const subject = subjects.find(s => s.id === id);
      const totalTopics = data.outline.reduce((sum, sec) => sum + sec.items.length, 0);
      gridHTML += `
        <div class="knowledge-card animate-in" data-subject="${id}">
          <div class="knowledge-card-icon" style="background:${subject ? subject.color + '20' : 'var(--accent-gold-glow)'};color:${subject ? subject.color : 'var(--accent-gold)'};">
            &#9733;
          </div>
          <h3>${data.title}</h3>
          <p>${data.desc}</p>
          <div class="knowledge-card-stats">
            <span class="knowledge-card-stat"><strong>${data.outline.length}</strong> 章节</span>
            <span class="knowledge-card-stat"><strong>${totalTopics}</strong> 考点</span>
          </div>
        </div>`;
    });

    container.innerHTML = `
      <div id="knowledgeListView">
        <div class="knowledge-grid">${gridHTML}</div>
      </div>
      <div class="knowledge-detail" id="knowledgeDetailView">
        <div class="knowledge-detail-header">
          <button class="back-btn" id="btnBackKnowledge">&#8592;</button>
          <h2 id="knowledgeDetailTitle" style="font-family:var(--font-serif);font-size:1.3rem;"></h2>
        </div>
        <div class="card">
          <div id="knowledgeDetailContent"></div>
        </div>
      </div>`;

    this._bindEvents();
  },

  destroy() {},

  _bindEvents() {
    // Card click → open detail
    container.querySelector('#knowledgeListView')?.addEventListener('click', (e) => {
      const card = e.target.closest('[data-subject]');
      if (!card) return;
      this._openDetail(card.dataset.subject);
    });

    // Back button
    container.querySelector('#btnBackKnowledge')?.addEventListener('click', () => {
      this._closeDetail();
    });
  },

  _openDetail(id) {
    const data = knowledge[id];
    if (!data) return;

    const listView = container.querySelector('#knowledgeListView');
    const detailView = container.querySelector('#knowledgeDetailView');
    const titleEl = container.querySelector('#knowledgeDetailTitle');
    const contentEl = container.querySelector('#knowledgeDetailContent');

    listView.style.display = 'none';
    detailView.style.display = 'block';
    titleEl.textContent = data.title;

    let html = '<ul class="outline-tree">';
    data.outline.forEach(section => {
      html += `<li><span class="tree-section">${section.section}</span><ul>`;
      section.items.forEach(item => {
        html += `<li><span class="tree-item">${item}</span></li>`;
      });
      html += '</ul></li>';
    });
    html += '</ul>';
    contentEl.innerHTML = html;
  },

  _closeDetail() {
    container.querySelector('#knowledgeListView').style.display = 'block';
    container.querySelector('#knowledgeDetailView').style.display = 'none';
  }
};
