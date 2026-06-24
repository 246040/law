/**
 * 法考通 · 状态管理模块
 * 基于 localStorage 的发布-订阅状态管理
 */

const DEFAULT_STATE = {
  settings: { examDate: '', dailyGoal: 30, targetScore: 180 },
  stats: { totalAnswered: 0, totalCorrect: 0 },
  mistakes: [],
  cardStatus: {},
  subjectProgress: {},
  dailyLog: {},  // { 'YYYY-MM-DD': { answered: N, correct: N } }
  streak: { current: 0, best: 0, lastDate: null },  // 连续学习天数
  examHistory: [],  // 模考历史记录
};

export class Store {
  #key;
  #state;
  #listeners;

  constructor(key = 'fakao_data') {
    this.#key = key;
    this.#listeners = new Map();
    this.#state = this.#load();
  }

  // ---- Read ----

  get(path) {
    if (!path) return this.#state;
    const keys = path.split('.');
    let value = this.#state;
    for (const k of keys) {
      if (value == null) return undefined;
      value = value[k];
    }
    return value;
  }

  // ---- Write ----

  set(path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    let target = this.#state;
    for (const k of keys) {
      if (target[k] == null || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }
    target[last] = value;
    this.#save();
    this.#emit(path, value);
  }

  // ---- Convenience mutations ----

  increment(path, amount = 1) {
    const current = this.get(path) || 0;
    this.set(path, current + amount);
  }

  push(path, item) {
    const arr = this.get(path) || [];
    arr.push(item);
    this.set(path, arr);
  }

  remove(path, predicate) {
    const arr = this.get(path) || [];
    this.set(path, arr.filter((item) => !predicate(item)));
  }

  // ---- Pub/Sub ----

  subscribe(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(callback);
    // Return unsubscribe function
    return () => this.#listeners.get(event)?.delete(callback);
  }

  // ---- Import / Export ----

  export() {
    return JSON.stringify(this.#state, null, 2);
  }

  import(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      this.#state = { ...DEFAULT_STATE, ...data };
      this.#save();
      this.#emit('*', this.#state);
    } catch (e) {
      console.error('[Store] Import failed:', e);
    }
  }

  reset() {
    this.#state = structuredClone(DEFAULT_STATE);
    this.#save();
    this.#emit('*', this.#state);
  }

  // ---- Private ----

  #load() {
    try {
      const raw = localStorage.getItem(this.#key);
      if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch (e) {
      console.warn('[Store] Failed to load state:', e);
    }
    return structuredClone(DEFAULT_STATE);
  }

  #save() {
    try {
      localStorage.setItem(this.#key, JSON.stringify(this.#state));
    } catch (e) {
      console.warn('[Store] Failed to save state:', e);
    }
  }

  #emit(event, data) {
    // Notify exact match
    this.#listeners.get(event)?.forEach((cb) => cb(data));
    // Notify wildcard
    if (event !== '*') {
      this.#listeners.get('*')?.forEach((cb) => cb(data));
    }
  }
}
