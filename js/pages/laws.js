/**
 * 法考通 · 重点法条页面
 */
import { $ } from '../utils/dom.js';
import { debounce } from '../utils/helpers.js';

let laws, container;

export default {
  init(_container, _store, data) {
    laws = data.laws;
    container = _container;
    this.render();
  },

  render() {
    container.innerHTML = `
      <div class="law-search">
        <span class="law-search-icon">&#128269;</span>
        <input type="text" placeholder="搜索法律名称..." id="lawSearchInput">
      </div>
      <div class="law-list" id="lawList"></div>`;

    this.#renderList('');
    this.#bindEvents();
  },

  destroy() {},

  #bindEvents() {
    const input = $('#lawSearchInput', container);
    if (input) {
      input.addEventListener('input', debounce(() => {
        this.#renderList(input.value);
      }, 200));
    }
  },

  #renderList(query) {
    const q = (query || '').toLowerCase();
    const filtered = laws.filter(law =>
      law.name.toLowerCase().includes(q) ||
      law.category.toLowerCase().includes(q) ||
      law.keywords.toLowerCase().includes(q)
    );

    const listEl = $('#lawList', container);
    if (!listEl) return;

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">&#9878;</div>
          <h3>未找到匹配的法律</h3>
          <p>尝试更换搜索关键词</p>
        </div>`;
      return;
    }

    listEl.innerHTML = filtered.map(law => `
      <div class="law-item animate-in">
        <div class="law-item-left">
          <div class="law-item-icon">&#9878;</div>
          <div>
            <div class="law-item-name">${law.name}</div>
            <div class="law-item-meta">${law.category} · ${law.keywords}</div>
          </div>
        </div>
        <span class="badge ${law.importance === 'high' ? 'badge-red' : 'badge-blue'}">${law.importance === 'high' ? '必读' : '常考'}</span>
      </div>`).join('');
  }
};
