/**
 * 法考通 · SM-2 间隔重复算法
 * 
 * 基于 SuperMemo 2 算法，用于速记卡片和错题本的智能复习调度。
 * 
 * 核心参数：
 * - easeFactor (EF): 难度因子，初始 2.5，最低 1.3
 * - interval: 复习间隔（天）
 * - repetitions: 连续正确次数
 * - quality: 用户评价 0-5（0-2 失败，3-5 成功）
 * 
 * 评价映射：
 * - 困难 (hard) → quality = 2（失败，重新开始）
 * - 还行 (ok)   → quality = 3（勉强记住）
 * - 掌握 (easy) → quality = 5（轻松记住）
 */

/**
 * 计算下一次复习的参数
 * @param {Object} card - 卡片当前状态
 * @param {number} card.easeFactor - 难度因子 (≥ 1.3)
 * @param {number} card.interval - 当前间隔（天）
 * @param {number} card.repetitions - 连续正确次数
 * @param {number} quality - 用户评价 (0-5)
 * @returns {Object} 更新后的卡片参数
 */
export function sm2(card, quality) {
  let { easeFactor = 2.5, interval = 0, repetitions = 0 } = card;

  // 确保 quality 在有效范围
  quality = Math.max(0, Math.min(5, Math.round(quality)));

  if (quality >= 3) {
    // 回答正确
    switch (repetitions) {
      case 0:
        interval = 1;
        break;
      case 1:
        interval = 6;
        break;
      default:
        interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // 回答错误，重新开始
    repetitions = 0;
    interval = 1;
  }

  // 更新难度因子
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval,
    repetitions,
    nextReview: Date.now() + interval * 24 * 60 * 60 * 1000,
  };
}

/**
 * 创建新卡片的初始 SM-2 状态
 * @returns {Object} 初始状态
 */
export function createCardState() {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: Date.now(), // 立即可复习
  };
}

/**
 * 将用户交互级别映射到 SM-2 quality 评分
 * @param {'hard'|'ok'|'easy'} level - 用户评价
 * @returns {number} quality (0-5)
 */
export function levelToQuality(level) {
  switch (level) {
    case 'hard': return 2;  // 失败，需要重学
    case 'ok': return 3;    // 勉强记住
    case 'easy': return 5;  // 轻松掌握
    default: return 3;
  }
}

/**
 * 判断卡片是否到期需要复习
 * @param {Object} cardState - 卡片 SM-2 状态
 * @returns {boolean}
 */
export function isDue(cardState) {
  return Date.now() >= (cardState.nextReview || 0);
}

/**
 * 对卡片数组按复习优先级排序
 * 排序规则：过期越久的排越前，同时 EF 低的优先（更难的先复习）
 * @param {Array} cards - 带有 sm2State 属性的卡片数组
 * @returns {Array} 排序后的数组（不修改原数组）
 */
export function sortByPriority(cards) {
  const now = Date.now();
  return [...cards].sort((a, b) => {
    const aState = a.sm2State || createCardState();
    const bState = b.sm2State || createCardState();

    // 优先级 1：过期的排前面
    const aOverdue = now - (aState.nextReview || 0);
    const bOverdue = now - (bState.nextReview || 0);

    if (aOverdue > 0 && bOverdue <= 0) return -1;
    if (bOverdue > 0 && aOverdue <= 0) return 1;

    // 优先级 2：过期时间长的排前面
    if (aOverdue > 0 && bOverdue > 0) {
      return bOverdue - aOverdue;
    }

    // 优先级 3：EF 低的排前面（更难的先复习）
    return (aState.easeFactor || 2.5) - (bState.easeFactor || 2.5);
  });
}
