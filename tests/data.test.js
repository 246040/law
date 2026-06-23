/**
 * 单元测试 · 数据完整性验证
 * 确保 JSON 数据文件格式正确、字段完整
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadJSON(relativePath) {
  const full = resolve('data', relativePath);
  return JSON.parse(readFileSync(full, 'utf-8'));
}

describe('数据完整性', () => {
  describe('subjects.json', () => {
    const subjects = loadJSON('subjects.json');

    it('应该是非空数组', () => {
      expect(Array.isArray(subjects)).toBe(true);
      expect(subjects.length).toBeGreaterThan(0);
    });

    it('每个学科应包含必要字段', () => {
      subjects.forEach(s => {
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('name');
        expect(s).toHaveProperty('color');
        expect(typeof s.id).toBe('string');
        expect(typeof s.name).toBe('string');
        expect(s.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('id 不应重复', () => {
      const ids = subjects.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('questions/', () => {
    const subjects = loadJSON('subjects.json');
    const subjectIds = subjects.map(s => s.id);

    it('每个学科应有对应的题目文件', () => {
      subjectIds.forEach(id => {
        const questions = loadJSON(`questions/${id}.json`);
        expect(Array.isArray(questions)).toBe(true);
      });
    });

    it('每道题应包含必要字段', () => {
      subjectIds.forEach(id => {
        const questions = loadJSON(`questions/${id}.json`);
        questions.forEach(q => {
          expect(q).toHaveProperty('id');
          expect(q).toHaveProperty('subject');
          expect(q).toHaveProperty('type');
          expect(q).toHaveProperty('stem');
          expect(q).toHaveProperty('options');
          expect(q).toHaveProperty('answer');
          expect(q).toHaveProperty('explanation');
          expect(q.subject).toBe(id);
          expect(['single', 'multi']).toContain(q.type);
          expect(Array.isArray(q.options)).toBe(true);
          expect(q.options.length).toBeGreaterThanOrEqual(2);
          expect(typeof q.answer).toBe('number');
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(q.options.length);
        });
      });
    });

    it('题目 id 全局不应重复', () => {
      const allIds = [];
      subjectIds.forEach(id => {
        const questions = loadJSON(`questions/${id}.json`);
        questions.forEach(q => allIds.push(q.id));
      });
      expect(new Set(allIds).size).toBe(allIds.length);
    });
  });

  describe('flashcards.json', () => {
    const flashcards = loadJSON('flashcards.json');

    it('应该是非空数组', () => {
      expect(Array.isArray(flashcards)).toBe(true);
      expect(flashcards.length).toBeGreaterThan(0);
    });

    it('每张卡片应包含 front/back/subject', () => {
      flashcards.forEach(card => {
        expect(card).toHaveProperty('front');
        expect(card).toHaveProperty('back');
        expect(card).toHaveProperty('subject');
        expect(typeof card.front).toBe('string');
        expect(typeof card.back).toBe('string');
        expect(card.front.length).toBeGreaterThan(0);
        expect(card.back.length).toBeGreaterThan(0);
      });
    });
  });

  describe('knowledge.json', () => {
    const knowledge = loadJSON('knowledge.json');

    it('应该是对象', () => {
      expect(typeof knowledge).toBe('object');
      expect(knowledge).not.toBeNull();
      expect(Object.keys(knowledge).length).toBeGreaterThan(0);
    });

    it('每个学科应有 title/desc/outline', () => {
      Object.entries(knowledge).forEach(([id, data]) => {
        expect(data).toHaveProperty('title');
        expect(data).toHaveProperty('desc');
        expect(data).toHaveProperty('outline');
        expect(Array.isArray(data.outline)).toBe(true);
        data.outline.forEach(section => {
          expect(section).toHaveProperty('section');
          expect(section).toHaveProperty('items');
          expect(Array.isArray(section.items)).toBe(true);
        });
      });
    });
  });

  describe('laws.json', () => {
    const laws = loadJSON('laws.json');

    it('应该是非空数组', () => {
      expect(Array.isArray(laws)).toBe(true);
      expect(laws.length).toBeGreaterThan(0);
    });

    it('每部法律应包含 name/category/importance', () => {
      laws.forEach(law => {
        expect(law).toHaveProperty('name');
        expect(law).toHaveProperty('category');
        expect(law).toHaveProperty('importance');
        expect(typeof law.name).toBe('string');
        expect(['high', 'medium', 'low']).toContain(law.importance);
      });
    });
  });
});
