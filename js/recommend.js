/**
 * 法考通 · 智能学习推荐引擎
 * 基于薄弱学科、错题频率、遗忘曲线生成今日学习计划
 */

/**
 * 生成今日学习推荐
 * @param {Object} state - 当前状态
 * @param {Array} subjects - 学科列表
 * @param {Array} questions - 题库
 * @returns {Object} 推荐结果
 */
export function generateRecommendation(state, subjects, questions) {
  const recommendations = [];

  // 1. 分析薄弱学科（正确率低于60%且至少答过10题）
  const weakSubjects = analyzeWeakSubjects(state, subjects);

  // 2. 分析高频错题（错3次以上未掌握）
  const frequentMistakes = analyzeFrequentMistakes(state, questions);

  // 3. 分析学习间隔（超过3天未碰的学科）
  const neglectedSubjects = analyzeNeglectedSubjects(state, subjects, questions);

  // 4. 计算今日目标进度
  const todayProgress = getTodayProgress(state);

  // 生成推荐
  if (weakSubjects.length > 0) {
    recommendations.push({
      type: 'weak_subject',
      priority: 'high',
      icon: '🎯',
      title: '薄弱学科强化',
      description: `${weakSubjects[0].name} 正确率仅 ${weakSubjects[0].accuracy}%，建议专项突破`,
      action: 'practice',
      params: { subject: weakSubjects[0].id, count: 20 }
    });
  }

  if (frequentMistakes.length > 0) {
    recommendations.push({
      type: 'mistake_review',
      priority: 'high',
      icon: '🔄',
      title: '错题复习',
      description: `有 ${frequentMistakes.length} 道高频错题需要巩固`,
      action: 'mistakes',
      params: {}
    });
  }

  if (neglectedSubjects.length > 0) {
    recommendations.push({
      type: 'neglected',
      priority: 'medium',
      icon: '⏰',
      title: '遗忘预警',
      description: `${neglectedSubjects[0].name} 已 ${neglectedSubjects[0].daysSince} 天未学习，建议复习`,
      action: 'practice',
      params: { subject: neglectedSubjects[0].id, count: 10 }
    });
  }

  // 如果今日目标未完成
  const dailyGoal = state.settings?.dailyGoal || 30;
  const remaining = dailyGoal - todayProgress.answered;
  if (remaining > 0) {
    recommendations.push({
      type: 'daily_goal',
      priority: 'medium',
      icon: '📊',
      title: '今日目标',
      description: `还差 ${remaining} 题达到今日目标（${todayProgress.answered}/${dailyGoal}）`,
      action: 'practice',
      params: { count: remaining }
    });
  }

  // 如果一切都很好
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'exam_ready',
      priority: 'low',
      icon: '🏆',
      title: '状态良好',
      description: '今日学习目标已完成，可以尝试一次模考检验水平',
      action: 'exam',
      params: {}
    });
  }

  return {
    recommendations: recommendations.sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      return (p[a.priority] || 2) - (p[b.priority] || 2);
    }),
    weakSubjects,
    frequentMistakes,
    neglectedSubjects,
    todayProgress
  };
}

/**
 * 分析薄弱学科
 */
function analyzeWeakSubjects(state, subjects) {
  const progress = state.subjectProgress || {};
  return subjects
    .map(sub => {
      const data = progress[sub.id];
      if (!data || data.answered < 10) return null;
      const accuracy = Math.round(data.correct / data.answered * 100);
      if (accuracy < 60) {
        return { id: sub.id, name: sub.name, accuracy, answered: data.answered };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.accuracy - b.accuracy);
}

/**
 * 分析高频错题
 */
function analyzeFrequentMistakes(state, questions) {
  const mistakes = state.mistakes || [];
  return mistakes
    .filter(m => m.reviewCount >= 3 || (Date.now() - m.addedAt < 7 * 86400000))
    .map(m => {
      const q = questions.find(qq => qq.id === m.questionId);
      return q ? { ...m, question: q } : null;
    })
    .filter(Boolean)
    .slice(0, 10);
}

/**
 * 分析被忽视的学科
 */
function analyzeNeglectedSubjects(state, subjects, questions) {
  const dailyLog = state.dailyLog || {};
  const progress = state.subjectProgress || {};
  const today = new Date();

  return subjects
    .map(sub => {
      // 如果从未学习过这个学科，跳过
      if (!progress[sub.id] || progress[sub.id].answered === 0) return null;

      // 找到该学科最后一次出现在 dailyLog 的日期
      // 简化处理：检查最近学习日期（基于整体日志）
      const sortedDates = Object.keys(dailyLog).sort().reverse();
      const lastStudyDate = sortedDates[0]; // 最近学习日

      if (!lastStudyDate) return null;

      const daysSince = Math.floor((today - new Date(lastStudyDate)) / 86400000);

      if (daysSince >= 3) {
        return { id: sub.id, name: sub.name, daysSince };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.daysSince - a.daysSince);
}

/**
 * 获取今日学习进度
 */
function getTodayProgress(state) {
  const today = new Date().toISOString().slice(0, 10);
  const dailyLog = state.dailyLog || {};
  const todayLog = dailyLog[today] || { answered: 0, correct: 0 };
  return {
    answered: todayLog.answered,
    correct: todayLog.correct,
    accuracy: todayLog.answered > 0 ? Math.round(todayLog.correct / todayLog.answered * 100) : 0
  };
}
