/**
 * 法考通 · 多选题评分算法测试
 */
import { describe, it, expect } from 'vitest';

// 内联 gradeAnswer 逻辑用于测试（与 practice.js 保持一致）
function isMultiType(q) {
  return q.type === 'multiple' || q.type === 'uncertain' || Array.isArray(q.answer);
}

function gradeAnswer(q, selectedOptions) {
  if (isMultiType(q)) {
    const correctSet = new Set(q.answer);
    const selectedSet = new Set(selectedOptions);

    const hasWrong = selectedOptions.some(s => !correctSet.has(s));
    if (hasWrong || selectedOptions.length === 0) {
      return { correct: false, score: 'zero' };
    }

    if (selectedOptions.length === correctSet.size &&
        selectedOptions.every(s => correctSet.has(s))) {
      return { correct: true, score: 'full' };
    }

    return { correct: false, score: 'partial' };
  } else {
    const isCorrect = selectedOptions.length === 1 && selectedOptions[0] === q.answer;
    return { correct: isCorrect, score: isCorrect ? 'full' : 'zero' };
  }
}

describe('gradeAnswer - 单选题', () => {
  const singleQ = { type: 'single', answer: 1, options: ['A', 'B', 'C', 'D'] };

  it('选对得满分', () => {
    const result = gradeAnswer(singleQ, [1]);
    expect(result.correct).toBe(true);
    expect(result.score).toBe('full');
  });

  it('选错得零分', () => {
    const result = gradeAnswer(singleQ, [0]);
    expect(result.correct).toBe(false);
    expect(result.score).toBe('zero');
  });

  it('未选得零分', () => {
    const result = gradeAnswer(singleQ, []);
    expect(result.correct).toBe(false);
    expect(result.score).toBe('zero');
  });
});

describe('gradeAnswer - 多选题', () => {
  const multiQ = { type: 'multiple', answer: [0, 2], options: ['A', 'B', 'C', 'D'] };

  it('全对得满分', () => {
    const result = gradeAnswer(multiQ, [0, 2]);
    expect(result.correct).toBe(true);
    expect(result.score).toBe('full');
  });

  it('全对（顺序不同）得满分', () => {
    const result = gradeAnswer(multiQ, [2, 0]);
    expect(result.correct).toBe(true);
    expect(result.score).toBe('full');
  });

  it('少选得半分', () => {
    const result = gradeAnswer(multiQ, [0]);
    expect(result.correct).toBe(false);
    expect(result.score).toBe('partial');
  });

  it('少选另一个也得半分', () => {
    const result = gradeAnswer(multiQ, [2]);
    expect(result.correct).toBe(false);
    expect(result.score).toBe('partial');
  });

  it('多选（含错误选项）得零分', () => {
    const result = gradeAnswer(multiQ, [0, 1, 2]);
    expect(result.correct).toBe(false);
    expect(result.score).toBe('zero');
  });

  it('全错得零分', () => {
    const result = gradeAnswer(multiQ, [1, 3]);
    expect(result.correct).toBe(false);
    expect(result.score).toBe('zero');
  });

  it('错选一个（不含正确）得零分', () => {
    const result = gradeAnswer(multiQ, [1]);
    expect(result.correct).toBe(false);
    expect(result.score).toBe('zero');
  });

  it('未选得零分', () => {
    const result = gradeAnswer(multiQ, []);
    expect(result.correct).toBe(false);
    expect(result.score).toBe('zero');
  });
});

describe('gradeAnswer - 不定项选择题', () => {
  const uncertainQ = { type: 'uncertain', answer: [1, 2, 3], options: ['A', 'B', 'C', 'D'] };

  it('全对得满分', () => {
    const result = gradeAnswer(uncertainQ, [1, 2, 3]);
    expect(result.correct).toBe(true);
    expect(result.score).toBe('full');
  });

  it('少选得半分', () => {
    const result = gradeAnswer(uncertainQ, [1, 2]);
    expect(result.correct).toBe(false);
    expect(result.score).toBe('partial');
  });

  it('只选一个正确的得半分', () => {
    const result = gradeAnswer(uncertainQ, [3]);
    expect(result.correct).toBe(false);
    expect(result.score).toBe('partial');
  });

  it('多选（含错误）得零分', () => {
    const result = gradeAnswer(uncertainQ, [0, 1, 2, 3]);
    expect(result.correct).toBe(false);
    expect(result.score).toBe('zero');
  });
});

describe('gradeAnswer - 三选题（ABC正确）', () => {
  const threeQ = { type: 'multiple', answer: [0, 1, 2], options: ['A', 'B', 'C', 'D'] };

  it('全选ABC得满分', () => {
    const result = gradeAnswer(threeQ, [0, 1, 2]);
    expect(result.correct).toBe(true);
    expect(result.score).toBe('full');
  });

  it('选AB少选得半分', () => {
    const result = gradeAnswer(threeQ, [0, 1]);
    expect(result.correct).toBe(false);
    expect(result.score).toBe('partial');
  });

  it('选ABCD多选得零分', () => {
    const result = gradeAnswer(threeQ, [0, 1, 2, 3]);
    expect(result.correct).toBe(false);
    expect(result.score).toBe('zero');
  });
});
