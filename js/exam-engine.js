/**
 * 法考通 · 模考引擎
 * 负责组卷、计时、评分、成绩单生成
 */

// ---- 考试配置 ----
export const EXAM_CONFIGS = {
  paper1: {
    name: '客观题卷一',
    time: 180 * 60, // 180 分钟（秒）
    subjects: ['xs', 'ss', 'xz', 'xf', 'fl'],  // 刑法、刑诉、行政法、宪法、法理学
    composition: { single: 50, multiple: 35, uncertain: 15 },
    scoring: { single: 1, multiple: 2, uncertain: 2 },
    totalScore: 150,
    passScore: 108 // 卷一+卷二合计180，单卷参考线108
  },
  paper2: {
    name: '客观题卷二',
    time: 180 * 60,
    subjects: ['mg', 'ms', 'sf', 'jj', 'gj'],  // 民法、民诉、商法、经济法、国际法
    composition: { single: 50, multiple: 35, uncertain: 15 },
    scoring: { single: 1, multiple: 2, uncertain: 2 },
    totalScore: 150,
    passScore: 108
  },
  mini: {
    name: '迷你模考',
    time: 45 * 60,
    subjects: null, // 全部学科
    composition: { single: 15, multiple: 10, uncertain: 5 },
    scoring: { single: 1, multiple: 2, uncertain: 2 },
    totalScore: 45,
    passScore: 27
  },
  subject: {
    name: '学科专项',
    time: 30 * 60,
    subjects: null, // 由用户选择
    composition: { single: 10, multiple: 7, uncertain: 3 },
    scoring: { single: 1, multiple: 2, uncertain: 2 },
    totalScore: 30,
    passScore: 18
  }
};

// ---- 辅助工具 ----
function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function isMultiType(q) {
  return q.type === 'multiple' || q.type === 'uncertain' || Array.isArray(q.answer);
}

// ---- 评分函数 ----
export function gradeQuestion(q, selectedOptions) {
  if (isMultiType(q)) {
    const correctSet = new Set(q.answer);
    const hasWrong = selectedOptions.some(s => !correctSet.has(s));
    if (hasWrong || selectedOptions.length === 0) {
      return { correct: false, score: 'zero', points: 0 };
    }
    if (selectedOptions.length === correctSet.size &&
        selectedOptions.every(s => correctSet.has(s))) {
      const points = q.type === 'uncertain' ? 2 : 2;
      return { correct: true, score: 'full', points };
    }
    // 少选得分：该题分值的一半
    const halfPoints = q.type === 'uncertain' ? 1 : 1;
    return { correct: false, score: 'partial', points: halfPoints };
  } else {
    const isCorrect = selectedOptions.length === 1 && selectedOptions[0] === q.answer;
    return { correct: isCorrect, score: isCorrect ? 'full' : 'zero', points: isCorrect ? 1 : 0 };
  }
}

// ---- 模考引擎类 ----
export class ExamEngine {
  constructor(config, allQuestions) {
    this.config = config;
    this.allQuestions = allQuestions;
    this.questions = [];
    this.answers = {};       // { questionId: [selectedOptions] }
    this.marks = {};         // { questionId: true } 标记题目
    this.startTime = null;
    this.endTime = null;
    this.timeRemaining = config.time;
    this.status = 'idle';    // idle | running | paused | finished
    this.timer = null;
    this.onTick = null;      // 计时回调
    this.onTimeUp = null;    // 时间到回调
  }

  /**
   * 智能组卷
   * 按题型比例和学科分布从题库中抽取
   */
  generatePaper() {
    const { subjects, composition } = this.config;
    
    // 按学科筛选题池
    let pool = subjects
      ? this.allQuestions.filter(q => subjects.includes(q.subject))
      : [...this.allQuestions];

    // 按题型分组
    const singlePool = shuffle(pool.filter(q => q.type === 'single' || (!q.type && !Array.isArray(q.answer))));
    const multiPool = shuffle(pool.filter(q => q.type === 'multiple'));
    const uncertainPool = shuffle(pool.filter(q => q.type === 'uncertain'));

    // 组卷
    const paper = [];

    // 单选题
    const singles = singlePool.slice(0, composition.single);
    paper.push(...singles);

    // 多选题（如果不够，从单选池中补充并转为多选模式标记）
    const multis = multiPool.slice(0, composition.multiple);
    paper.push(...multis);

    // 不定项（如果不够，从多选池中补充）
    const uncertains = uncertainPool.slice(0, composition.uncertain);
    paper.push(...uncertains);

    // 如果任何题型不够，从剩余题池补充
    const usedIds = new Set(paper.map(q => q.id));
    const remaining = shuffle(pool.filter(q => !usedIds.has(q.id)));
    const totalNeeded = composition.single + composition.multiple + composition.uncertain;
    
    while (paper.length < totalNeeded && remaining.length > 0) {
      paper.push(remaining.pop());
    }

    this.questions = paper;
    return paper;
  }

  /**
   * 开始考试
   */
  start() {
    if (this.questions.length === 0) {
      this.generatePaper();
    }
    this.status = 'running';
    this.startTime = Date.now();
    this.timeRemaining = this.config.time;
    this._startTimer();
  }

  /**
   * 暂停（仅模拟，正式模考不可暂停）
   */
  pause() {
    if (this.status !== 'running') return;
    this.status = 'paused';
    this._stopTimer();
  }

  /**
   * 恢复
   */
  resume() {
    if (this.status !== 'paused') return;
    this.status = 'running';
    this._startTimer();
  }

  /**
   * 提交答案
   */
  submitAnswer(questionId, selectedOptions) {
    this.answers[questionId] = [...selectedOptions];
  }

  /**
   * 标记/取消标记题目
   */
  toggleMark(questionId) {
    this.marks[questionId] = !this.marks[questionId];
  }

  /**
   * 交卷
   */
  finish() {
    this.status = 'finished';
    this.endTime = Date.now();
    this._stopTimer();
    return this.getReport();
  }

  /**
   * 获取题目状态（已答/未答/标记）
   */
  getQuestionStatus(questionId) {
    const answered = this.answers[questionId]?.length > 0;
    const marked = !!this.marks[questionId];
    return { answered, marked };
  }

  /**
   * 统计已答/未答数量
   */
  getProgress() {
    const total = this.questions.length;
    const answered = Object.values(this.answers).filter(a => a.length > 0).length;
    const marked = Object.values(this.marks).filter(Boolean).length;
    return { total, answered, unanswered: total - answered, marked };
  }

  /**
   * 生成成绩报告
   */
  getReport() {
    let totalPoints = 0;
    let fullCount = 0;
    let partialCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const bySubject = {};
    const byType = { single: { points: 0, total: 0 }, multiple: { points: 0, total: 0 }, uncertain: { points: 0, total: 0 } };

    this.questions.forEach(q => {
      const selected = this.answers[q.id] || [];
      const type = q.type || 'single';
      const maxPoints = type === 'single' ? 1 : 2;

      if (selected.length === 0) {
        unansweredCount++;
        // 记录学科统计
        if (!bySubject[q.subject]) bySubject[q.subject] = { points: 0, total: 0, correct: 0, count: 0 };
        bySubject[q.subject].total += maxPoints;
        bySubject[q.subject].count++;
        byType[type].total += maxPoints;
        return;
      }

      const grade = gradeQuestion(q, selected);
      totalPoints += grade.points;

      if (grade.score === 'full') fullCount++;
      else if (grade.score === 'partial') partialCount++;
      else wrongCount++;

      // 学科统计
      if (!bySubject[q.subject]) bySubject[q.subject] = { points: 0, total: 0, correct: 0, count: 0 };
      bySubject[q.subject].points += grade.points;
      bySubject[q.subject].total += maxPoints;
      bySubject[q.subject].count++;
      if (grade.correct) bySubject[q.subject].correct++;

      // 题型统计
      byType[type].points += grade.points;
      byType[type].total += maxPoints;
    });

    const duration = this.endTime && this.startTime
      ? Math.round((this.endTime - this.startTime) / 1000)
      : this.config.time - this.timeRemaining;

    return {
      score: totalPoints,
      totalScore: this.config.totalScore,
      passScore: this.config.passScore,
      passed: totalPoints >= this.config.passScore,
      fullCount,
      partialCount,
      wrongCount,
      unansweredCount,
      questionCount: this.questions.length,
      duration,
      bySubject,
      byType,
      timestamp: Date.now()
    };
  }

  // ---- 计时器 ----

  _startTimer() {
    this._stopTimer();
    this.timer = setInterval(() => {
      this.timeRemaining--;
      if (this.onTick) this.onTick(this.timeRemaining);
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        if (this.onTimeUp) this.onTimeUp();
        this.finish();
      }
    }, 1000);
  }

  _stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * 格式化剩余时间为 HH:MM:SS
   */
  static formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}
