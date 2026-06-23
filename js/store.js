/**
 * 法考通关助手 - 数据存储层
 * 基于 LocalStorage 的持久化存储
 */

const Store = {
  KEYS: {
    HISTORY: 'lawpass_history',
    WRONG_BOOK: 'lawpass_wrongbook',
    STATS: 'lawpass_stats',
    THEME: 'lawpass_theme',
    SETTINGS: 'lawpass_settings'
  },

  // --- 基础读写 ---
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Store.get error:', key, e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Store.set error:', key, e);
    }
  },

  // --- 做题历史 ---
  getHistory() {
    return this.get(this.KEYS.HISTORY) || [];
  },

  addHistory(record) {
    const history = this.getHistory();
    history.push({
      ...record,
      timestamp: new Date().toISOString()
    });
    this.set(this.KEYS.HISTORY, history);
    this.updateStats();
  },

  // --- 错题本 ---
  getWrongBook() {
    return this.get(this.KEYS.WRONG_BOOK) || [];
  },

  addToWrongBook(questionId, userAnswer) {
    const wrongBook = this.getWrongBook();
    const existing = wrongBook.find(w => w.questionId === questionId);
    if (existing) {
      existing.wrongCount++;
      existing.lastWrong = new Date().toISOString();
      existing.lastAnswer = userAnswer;
    } else {
      wrongBook.push({
        questionId,
        userAnswer,
        wrongCount: 1,
        correctStreak: 0,
        lastWrong: new Date().toISOString(),
        lastAnswer: userAnswer,
        mastered: false
      });
    }
    this.set(this.KEYS.WRONG_BOOK, wrongBook);
  },

  markCorrectInWrongBook(questionId) {
    const wrongBook = this.getWrongBook();
    const item = wrongBook.find(w => w.questionId === questionId);
    if (item) {
      item.correctStreak++;
      if (item.correctStreak >= 3) {
        item.mastered = true;
      }
    }
    this.set(this.KEYS.WRONG_BOOK, wrongBook);
  },

  removeFromWrongBook(questionId) {
    let wrongBook = this.getWrongBook();
    wrongBook = wrongBook.filter(w => w.questionId !== questionId);
    this.set(this.KEYS.WRONG_BOOK, wrongBook);
  },

  getActiveWrongBook() {
    return this.getWrongBook().filter(w => !w.mastered);
  },

  // --- 统计 ---
  getStats() {
    return this.get(this.KEYS.STATS) || {
      totalDone: 0,
      totalCorrect: 0,
      correctRate: 0,
      byCategory: {},
      byDate: {},
      streak: 0
    };
  },

  updateStats() {
    const history = this.getHistory();
    const stats = {
      totalDone: history.length,
      totalCorrect: history.filter(h => h.correct).length,
      correctRate: 0,
      byCategory: {},
      byDate: {},
      streak: 0
    };

    if (stats.totalDone > 0) {
      stats.correctRate = Math.round((stats.totalCorrect / stats.totalDone) * 100);
    }

    // 按科目统计
    history.forEach(h => {
      const cat = h.category || '未分类';
      if (!stats.byCategory[cat]) {
        stats.byCategory[cat] = { done: 0, correct: 0 };
      }
      stats.byCategory[cat].done++;
      if (h.correct) stats.byCategory[cat].correct++;
    });

    // 按日期统计（近7天）
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayRecords = history.filter(h => h.timestamp && h.timestamp.startsWith(dateStr));
      stats.byDate[dateStr] = {
        done: dayRecords.length,
        correct: dayRecords.filter(r => r.correct).length
      };
    }

    // 连续做对（当前streak）
    let streak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].correct) streak++;
      else break;
    }
    stats.streak = streak;

    this.set(this.KEYS.STATS, stats);
    return stats;
  },

  getTodayStats() {
    const history = this.getHistory();
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = history.filter(h => h.timestamp && h.timestamp.startsWith(today));
    return {
      done: todayRecords.length,
      correct: todayRecords.filter(r => r.correct).length,
      rate: todayRecords.length > 0
        ? Math.round((todayRecords.filter(r => r.correct).length / todayRecords.length) * 100)
        : 0
    };
  },

  // --- 主题 ---
  getTheme() {
    return this.get(this.KEYS.THEME) || 'dark';
  },

  setTheme(theme) {
    this.set(this.KEYS.THEME, theme);
  },

  // --- 重置 ---
  resetAll() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};
