/**
 * 单元测试 · State 模块
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Store } from '../js/state.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('Store', () => {
  let store;

  beforeEach(() => {
    localStorageMock.clear();
    store = new Store('test_store');
  });

  describe('初始化', () => {
    it('应该返回默认状态', () => {
      expect(store.get('settings.dailyGoal')).toBe(30);
      expect(store.get('stats.totalAnswered')).toBe(0);
      expect(store.get('mistakes')).toEqual([]);
    });

    it('应该从 localStorage 恢复状态', () => {
      localStorageMock.setItem('test_store', JSON.stringify({
        settings: { examDate: '2026-09-01', dailyGoal: 50, targetScore: 200 },
        stats: { totalAnswered: 100, totalCorrect: 80 },
        mistakes: [],
        cardStatus: {},
        subjectProgress: {},
      }));
      const restored = new Store('test_store');
      expect(restored.get('settings.examDate')).toBe('2026-09-01');
      expect(restored.get('settings.dailyGoal')).toBe(50);
      expect(restored.get('stats.totalAnswered')).toBe(100);
    });
  });

  describe('get/set', () => {
    it('应该支持路径读写', () => {
      store.set('settings.examDate', '2026-09-15');
      expect(store.get('settings.examDate')).toBe('2026-09-15');
    });

    it('应该支持嵌套路径自动创建', () => {
      store.set('subjectProgress.xs.answered', 10);
      expect(store.get('subjectProgress.xs.answered')).toBe(10);
    });

    it('get 无参数应该返回完整状态', () => {
      const state = store.get();
      expect(state).toHaveProperty('settings');
      expect(state).toHaveProperty('stats');
      expect(state).toHaveProperty('mistakes');
    });

    it('get 不存在的路径应返回 undefined', () => {
      expect(store.get('nonexistent.deep.path')).toBeUndefined();
    });
  });

  describe('increment', () => {
    it('应该正确递增数值', () => {
      store.increment('stats.totalAnswered');
      store.increment('stats.totalAnswered');
      store.increment('stats.totalAnswered', 3);
      expect(store.get('stats.totalAnswered')).toBe(5);
    });

    it('对不存在的路径应从 0 开始', () => {
      store.increment('stats.newField', 7);
      expect(store.get('stats.newField')).toBe(7);
    });
  });

  describe('push/remove', () => {
    it('应该正确追加元素', () => {
      store.push('mistakes', { questionId: 'q1', addedAt: 1000, reviewCount: 0 });
      store.push('mistakes', { questionId: 'q2', addedAt: 2000, reviewCount: 0 });
      expect(store.get('mistakes')).toHaveLength(2);
      expect(store.get('mistakes')[0].questionId).toBe('q1');
    });

    it('应该正确删除匹配元素', () => {
      store.push('mistakes', { questionId: 'q1', addedAt: 1000, reviewCount: 0 });
      store.push('mistakes', { questionId: 'q2', addedAt: 2000, reviewCount: 0 });
      store.remove('mistakes', m => m.questionId === 'q1');
      expect(store.get('mistakes')).toHaveLength(1);
      expect(store.get('mistakes')[0].questionId).toBe('q2');
    });
  });

  describe('subscribe', () => {
    it('应该在 set 时触发回调', () => {
      const callback = vi.fn();
      store.subscribe('settings.examDate', callback);
      store.set('settings.examDate', '2026-10-01');
      expect(callback).toHaveBeenCalledWith('2026-10-01');
    });

    it('通配符 * 应响应所有变更', () => {
      const callback = vi.fn();
      store.subscribe('*', callback);
      store.set('settings.dailyGoal', 40);
      store.increment('stats.totalAnswered');
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('unsubscribe 后不再触发', () => {
      const callback = vi.fn();
      const unsub = store.subscribe('settings.examDate', callback);
      unsub();
      store.set('settings.examDate', '2026-11-01');
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('export/import', () => {
    it('export 应返回 JSON 字符串', () => {
      store.set('settings.examDate', '2026-09-01');
      const json = store.export();
      const parsed = JSON.parse(json);
      expect(parsed.settings.examDate).toBe('2026-09-01');
    });

    it('import 应恢复状态', () => {
      const data = { settings: { examDate: '2026-12-01', dailyGoal: 60, targetScore: 220 }, stats: { totalAnswered: 50, totalCorrect: 40 }, mistakes: [{ questionId: 'q5' }], cardStatus: {}, subjectProgress: {} };
      store.import(JSON.stringify(data));
      expect(store.get('settings.examDate')).toBe('2026-12-01');
      expect(store.get('mistakes')).toHaveLength(1);
    });

    it('import 无效 JSON 不应崩溃', () => {
      store.set('settings.examDate', '2026-09-01');
      store.import('invalid json {{{');
      // 原状态不变
      expect(store.get('settings.examDate')).toBe('2026-09-01');
    });
  });

  describe('reset', () => {
    it('应该恢复为默认状态', () => {
      store.set('settings.examDate', '2026-09-01');
      store.increment('stats.totalAnswered', 50);
      store.reset();
      expect(store.get('settings.examDate')).toBe('');
      expect(store.get('stats.totalAnswered')).toBe(0);
    });
  });

  describe('持久化', () => {
    it('set 后应该写入 localStorage', () => {
      store.set('settings.examDate', '2026-09-01');
      const raw = JSON.parse(localStorageMock.getItem('test_store'));
      expect(raw.settings.examDate).toBe('2026-09-01');
    });
  });
});
