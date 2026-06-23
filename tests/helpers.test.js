/**
 * 单元测试 · Helpers 工具函数
 */
import { describe, it, expect } from 'vitest';
import { shuffle, MARKERS, formatDateCN, daysUntil, debounce } from '../js/utils/helpers.js';

describe('helpers', () => {
  describe('shuffle', () => {
    it('应该返回相同长度的数组', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle([...arr]);
      expect(result).toHaveLength(arr.length);
    });

    it('应该包含所有原始元素', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle([...arr]);
      expect(result.sort()).toEqual(arr.sort());
    });

    it('空数组应该返回空数组', () => {
      expect(shuffle([])).toEqual([]);
    });

    it('单元素数组应该返回自身', () => {
      expect(shuffle([42])).toEqual([42]);
    });
  });

  describe('MARKERS', () => {
    it('应该是 A/B/C/D/E/F', () => {
      expect(MARKERS).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    });
  });

  describe('formatDateCN', () => {
    it('应该格式化时间戳', () => {
      // 2026-01-15 的时间戳
      const ts = new Date('2026-01-15T10:30:00').getTime();
      const result = formatDateCN(ts);
      expect(result).toContain('2026');
      expect(result).toContain('1');
      expect(result).toContain('15');
    });
  });

  describe('daysUntil', () => {
    it('未来日期应该返回正数', () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);
      const dateStr = future.toISOString().split('T')[0];
      const result = daysUntil(dateStr);
      expect(result).toBeGreaterThanOrEqual(9);
      expect(result).toBeLessThanOrEqual(11);
    });

    it('过去日期应该返回 0（被 clamp）', () => {
      const result = daysUntil('2020-01-01');
      expect(result).toBe(0);
    });

    it('今天应该返回 0', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(daysUntil(today)).toBe(0);
    });
  });

  describe('debounce', () => {
    it('应该延迟执行', async () => {
      let count = 0;
      const fn = debounce(() => { count++; }, 50);
      fn();
      fn();
      fn();
      expect(count).toBe(0);
      await new Promise(r => setTimeout(r, 80));
      expect(count).toBe(1);
    });
  });
});
