/**
 * 法考通 · 模考引擎单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ExamEngine, EXAM_CONFIGS, gradeQuestion } from '../js/exam-engine.js';

// 模拟题库
const mockQuestions = [
  // 单选题 (10道)
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `single_${i}`,
    type: 'single',
    subject: i < 5 ? 'xs' : 'mg',
    stem: `单选题 ${i + 1}`,
    options: ['A选项', 'B选项', 'C选项', 'D选项'],
    answer: i % 4,
    topic: '测试知识点'
  })),
  // 多选题 (8道)
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `multi_${i}`,
    type: 'multiple',
    subject: i < 4 ? 'xs' : 'mg',
    stem: `多选题 ${i + 1}`,
    options: ['A选项', 'B选项', 'C选项', 'D选项'],
    answer: [0, 1, 2],
    topic: '测试知识点'
  })),
  // 不定项 (5道)
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `uncertain_${i}`,
    type: 'uncertain',
    subject: 'xs',
    stem: `不定项 ${i + 1}`,
    options: ['A选项', 'B选项', 'C选项', 'D选项'],
    answer: [1, 3],
    topic: '测试知识点'
  }))
];

describe('gradeQuestion', () => {
  it('单选正确得 1 分', () => {
    const q = mockQuestions[0]; // answer: 0
    const result = gradeQuestion(q, [0]);
    expect(result).toEqual({ correct: true, score: 'full', points: 1 });
  });

  it('单选错误得 0 分', () => {
    const q = mockQuestions[0];
    const result = gradeQuestion(q, [2]);
    expect(result).toEqual({ correct: false, score: 'zero', points: 0 });
  });

  it('单选未答得 0 分', () => {
    const q = mockQuestions[0];
    const result = gradeQuestion(q, []);
    expect(result).toEqual({ correct: false, score: 'zero', points: 0 });
  });

  it('多选全对得 2 分', () => {
    const q = mockQuestions[10]; // answer: [0,1,2]
    const result = gradeQuestion(q, [0, 1, 2]);
    expect(result).toEqual({ correct: true, score: 'full', points: 2 });
  });

  it('多选少选得 1 分', () => {
    const q = mockQuestions[10];
    const result = gradeQuestion(q, [0, 1]);
    expect(result).toEqual({ correct: false, score: 'partial', points: 1 });
  });

  it('多选多选得 0 分', () => {
    const q = mockQuestions[10];
    const result = gradeQuestion(q, [0, 1, 2, 3]);
    expect(result).toEqual({ correct: false, score: 'zero', points: 0 });
  });

  it('多选错选得 0 分', () => {
    const q = mockQuestions[10];
    const result = gradeQuestion(q, [0, 3]);
    expect(result).toEqual({ correct: false, score: 'zero', points: 0 });
  });

  it('不定项全对得 2 分', () => {
    const q = mockQuestions[18]; // answer: [1,3]
    const result = gradeQuestion(q, [1, 3]);
    expect(result).toEqual({ correct: true, score: 'full', points: 2 });
  });

  it('不定项少选得 1 分', () => {
    const q = mockQuestions[18];
    const result = gradeQuestion(q, [1]);
    expect(result).toEqual({ correct: false, score: 'partial', points: 1 });
  });
});

describe('ExamEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new ExamEngine(EXAM_CONFIGS.mini, mockQuestions);
  });

  describe('generatePaper', () => {
    it('应生成试卷', () => {
      const paper = engine.generatePaper();
      expect(paper.length).toBeGreaterThan(0);
      expect(paper.length).toBeLessThanOrEqual(30);
    });

    it('试卷中的题目均来自题库', () => {
      const paper = engine.generatePaper();
      const allIds = new Set(mockQuestions.map(q => q.id));
      paper.forEach(q => {
        expect(allIds.has(q.id)).toBe(true);
      });
    });

    it('试卷中无重复题目', () => {
      const paper = engine.generatePaper();
      const ids = paper.map(q => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('start/finish', () => {
    it('start 后状态为 running', () => {
      engine.start();
      expect(engine.status).toBe('running');
      expect(engine.startTime).not.toBeNull();
      engine._stopTimer();
    });

    it('finish 后状态为 finished', () => {
      engine.start();
      const report = engine.finish();
      expect(engine.status).toBe('finished');
      expect(report).toBeDefined();
      expect(report.score).toBeTypeOf('number');
    });
  });

  describe('submitAnswer', () => {
    it('提交答案后可通过 getProgress 获取状态', () => {
      engine.generatePaper();
      engine.start();
      const q = engine.questions[0];
      engine.submitAnswer(q.id, [0]);
      const progress = engine.getProgress();
      expect(progress.answered).toBe(1);
      engine._stopTimer();
    });
  });

  describe('toggleMark', () => {
    it('标记和取消标记', () => {
      engine.generatePaper();
      const q = engine.questions[0];
      engine.toggleMark(q.id);
      expect(engine.marks[q.id]).toBe(true);
      engine.toggleMark(q.id);
      expect(engine.marks[q.id]).toBe(false);
    });
  });

  describe('getReport', () => {
    it('全部正确应得满分', () => {
      engine.generatePaper();
      engine.start();
      engine.questions.forEach(q => {
        const answer = Array.isArray(q.answer) ? q.answer : [q.answer];
        engine.submitAnswer(q.id, answer);
      });
      const report = engine.finish();
      expect(report.wrongCount).toBe(0);
      expect(report.unansweredCount).toBe(0);
      expect(report.score).toBeGreaterThan(0);
    });

    it('全不答应得 0 分', () => {
      engine.generatePaper();
      engine.start();
      const report = engine.finish();
      expect(report.score).toBe(0);
      expect(report.unansweredCount).toBe(engine.questions.length);
    });

    it('报告包含学科维度统计', () => {
      engine.generatePaper();
      engine.start();
      engine.questions.forEach(q => {
        engine.submitAnswer(q.id, [0]);
      });
      const report = engine.finish();
      expect(report.bySubject).toBeDefined();
      expect(Object.keys(report.bySubject).length).toBeGreaterThan(0);
    });
  });

  describe('formatTime', () => {
    it('格式化秒数为时间字符串', () => {
      expect(ExamEngine.formatTime(3661)).toBe('1:01:01');
      expect(ExamEngine.formatTime(65)).toBe('1:05');
      expect(ExamEngine.formatTime(0)).toBe('0:00');
      expect(ExamEngine.formatTime(3600)).toBe('1:00:00');
    });
  });
});
