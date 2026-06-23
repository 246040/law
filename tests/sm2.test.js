/**
 * SM-2 间隔重复算法 - 单元测试
 */
import { describe, it, expect } from 'vitest';
import { sm2, createCardState, levelToQuality, isDue, sortByPriority } from '../js/utils/sm2.js';

describe('SM-2 Algorithm', () => {
  describe('createCardState', () => {
    it('应返回初始状态', () => {
      const state = createCardState();
      expect(state.easeFactor).toBe(2.5);
      expect(state.interval).toBe(0);
      expect(state.repetitions).toBe(0);
      expect(state.nextReview).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('levelToQuality', () => {
    it('hard 映射为 2', () => {
      expect(levelToQuality('hard')).toBe(2);
    });
    it('ok 映射为 3', () => {
      expect(levelToQuality('ok')).toBe(3);
    });
    it('easy 映射为 5', () => {
      expect(levelToQuality('easy')).toBe(5);
    });
    it('未知值默认为 3', () => {
      expect(levelToQuality('unknown')).toBe(3);
    });
  });

  describe('sm2 核心计算', () => {
    it('首次回答正确（quality=3）：间隔=1天', () => {
      const result = sm2(createCardState(), 3);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('第二次回答正确：间隔=6天', () => {
      const state = { easeFactor: 2.5, interval: 1, repetitions: 1 };
      const result = sm2(state, 4);
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it('第三次回答正确：间隔=6*EF', () => {
      const state = { easeFactor: 2.5, interval: 6, repetitions: 2 };
      const result = sm2(state, 4);
      expect(result.interval).toBe(15); // round(6 * 2.5) = 15
      expect(result.repetitions).toBe(3);
    });

    it('回答错误（quality<3）：重置为间隔1天', () => {
      const state = { easeFactor: 2.5, interval: 15, repetitions: 3 };
      const result = sm2(state, 2);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });

    it('EF 不会低于 1.3', () => {
      let state = createCardState();
      // 连续回答 hard 多次
      for (let i = 0; i < 10; i++) {
        state = sm2(state, 0);
      }
      expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('quality=5 会提升 EF', () => {
      const state = { easeFactor: 2.5, interval: 1, repetitions: 1 };
      const result = sm2(state, 5);
      expect(result.easeFactor).toBeGreaterThan(2.5);
    });

    it('quality=3 会降低 EF', () => {
      const state = { easeFactor: 2.5, interval: 1, repetitions: 1 };
      const result = sm2(state, 3);
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it('nextReview 基于 interval 计算', () => {
      const before = Date.now();
      const result = sm2(createCardState(), 5);
      const expectedMin = before + result.interval * 24 * 60 * 60 * 1000;
      expect(result.nextReview).toBeGreaterThanOrEqual(expectedMin - 100);
    });
  });

  describe('isDue', () => {
    it('nextReview 在过去 → 到期', () => {
      expect(isDue({ nextReview: Date.now() - 1000 })).toBe(true);
    });
    it('nextReview 在未来 → 未到期', () => {
      expect(isDue({ nextReview: Date.now() + 86400000 })).toBe(false);
    });
    it('无 nextReview → 到期', () => {
      expect(isDue({})).toBe(true);
    });
  });

  describe('sortByPriority', () => {
    it('过期卡片排在未过期前面', () => {
      const cards = [
        { id: 'future', sm2State: { nextReview: Date.now() + 86400000, easeFactor: 2.5 } },
        { id: 'overdue', sm2State: { nextReview: Date.now() - 86400000, easeFactor: 2.5 } },
      ];
      const sorted = sortByPriority(cards);
      expect(sorted[0].id).toBe('overdue');
    });

    it('过期更久的排更前面', () => {
      const cards = [
        { id: 'overdue1d', sm2State: { nextReview: Date.now() - 86400000, easeFactor: 2.5 } },
        { id: 'overdue7d', sm2State: { nextReview: Date.now() - 7 * 86400000, easeFactor: 2.5 } },
      ];
      const sorted = sortByPriority(cards);
      expect(sorted[0].id).toBe('overdue7d');
    });

    it('未过期卡片按 EF 升序（更难的先复习）', () => {
      const future = Date.now() + 86400000;
      const cards = [
        { id: 'easy', sm2State: { nextReview: future, easeFactor: 2.8 } },
        { id: 'hard', sm2State: { nextReview: future, easeFactor: 1.5 } },
      ];
      const sorted = sortByPriority(cards);
      expect(sorted[0].id).toBe('hard');
    });

    it('不修改原数组', () => {
      const cards = [
        { id: 'a', sm2State: { nextReview: Date.now() + 1000, easeFactor: 2.5 } },
        { id: 'b', sm2State: { nextReview: Date.now() - 1000, easeFactor: 2.5 } },
      ];
      const sorted = sortByPriority(cards);
      expect(cards[0].id).toBe('a'); // 原数组不变
      expect(sorted[0].id).toBe('b');
    });
  });
});
