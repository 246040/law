/**
 * 法考通 · 速记卡片页面
 */
import { $ } from '../utils/dom.js';
import { shuffle } from '../utils/helpers.js';

let store, subjects, flashcards, container;
let deck = [];
let cardIndex = 0;
let filter = 'all';

export default {
  init(_container, _store, data) {
    store = _store;
    subjects = data.subjects;
    flashcards = data.flashcards;
    container = _container;
    filter = 'all';
    cardIndex = 0;
    this.#buildDeck();
    this.render();
  },

  render() {
    let filtersHTML = `<button class="filter-chip ${filter === 'all' ? 'active' : ''}" data-filter="all">全部</button>`;
    subjects.forEach(s => {
      if (flashcards.some(f => f.subject === s.id)) {
        filtersHTML += `<button class="filter-chip ${filter === s.id ? 'active' : ''}" data-filter="${s.id}">${s.name}</button>`;
      }
    });

    const card = deck[cardIndex];
    const front = card ? card.front : '暂无卡片';
    const back = card ? card.back.replace(/\\n/g, '<br>') : '--';

    container.innerHTML = `
      <div class="flashcard-container">
        <div class="practice-header">
          <div class="filter-group" id="flashcardFilters">${filtersHTML}</div>
          <button class="btn btn-ghost btn-sm" id="btnShuffle">&#8644; 随机顺序</button>
        </div>
        <div class="flashcard-scene">
          <div class="flashcard" id="flashcard">
            <div class="flashcard-face flashcard-front">
              <span class="flashcard-label">问题</span>
              <div class="flashcard-question">${front}</div>
            </div>
            <div class="flashcard-face flashcard-back">
              <span class="flashcard-label">答案</span>
              <div class="flashcard-answer">${back}</div>
            </div>
          </div>
        </div>
        <div class="flashcard-hint">点击卡片翻转 · 使用按钮切换</div>
        <div class="flashcard-counter">${deck.length > 0 ? `${cardIndex + 1} / ${deck.length}` : '0 / 0'}</div>
        <div class="flashcard-nav">
          <button class="btn btn-ghost btn-sm" id="btnPrev">&#8592; 上一张</button>
          <button class="btn btn-primary btn-sm" id="btnNext">下一张 &#8594;</button>
        </div>
        <div class="flashcard-difficulty">
          <button class="btn btn-ghost btn-sm" id="btnHard" style="color:var(--accent-red);">&#9888; 未掌握</button>
          <button class="btn btn-ghost btn-sm" id="btnOk" style="color:var(--accent-blue);">&#8618; 一般</button>
          <button class="btn btn-ghost btn-sm" id="btnEasy" style="color:var(--accent-green);">&#10003; 已掌握</button>
        </div>
      </div>`;

    this.#bindEvents();
  },

  destroy() {},

  #buildDeck() {
    deck = filter === 'all' ? [...flashcards] : flashcards.filter(f => f.subject === filter);
    if (cardIndex >= deck.length) cardIndex = 0;
  },

  #bindEvents() {
    // Flip
    $('#flashcard', container)?.addEventListener('click', () => {
      $('#flashcard', container)?.classList.toggle('flipped');
    });

    // Filters
    $('#flashcardFilters', container)?.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter]');
      if (!chip) return;
      filter = chip.dataset.filter;
      cardIndex = 0;
      this.#buildDeck();
      this.render();
    });

    // Shuffle
    $('#btnShuffle', container)?.addEventListener('click', () => {
      deck = shuffle(deck);
      cardIndex = 0;
      this.render();
    });

    // Nav
    $('#btnPrev', container)?.addEventListener('click', () => {
      if (deck.length === 0) return;
      cardIndex = (cardIndex - 1 + deck.length) % deck.length;
      this.render();
    });

    $('#btnNext', container)?.addEventListener('click', () => {
      if (deck.length === 0) return;
      cardIndex = (cardIndex + 1) % deck.length;
      this.render();
    });

    // Difficulty marks
    $('#btnHard', container)?.addEventListener('click', () => this.#mark('hard'));
    $('#btnOk', container)?.addEventListener('click', () => this.#mark('ok'));
    $('#btnEasy', container)?.addEventListener('click', () => this.#mark('easy'));
  },

  #mark(level) {
    if (deck.length === 0) return;
    const card = deck[cardIndex];
    const cardStatus = store.get('cardStatus') || {};
    cardStatus[card.id] = level;
    store.set('cardStatus', cardStatus);
    // Auto advance
    cardIndex = (cardIndex + 1) % deck.length;
    this.render();
  }
};
