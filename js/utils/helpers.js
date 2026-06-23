/**
 * 法考通 · 通用工具函数
 */

/** Fisher-Yates 洗牌算法 */
export function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 格式化日期为 yyyy-MM-dd */
export function formatDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 格式化日期为中文短格式 */
export function formatDateCN(date) {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
}

/** 计算距离某日期的天数 */
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/** 计算百分比 */
export function percentage(part, total, decimals = 0) {
  if (!total) return 0;
  return Number((part / total * 100).toFixed(decimals));
}

/** 防抖 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** 选项标记 A/B/C/D */
export const MARKERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** 异步加载 JSON */
export async function loadJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error(`[loadJSON] Failed to load ${url}:`, e);
    return null;
  }
}

/** 批量加载多个 JSON 文件 */
export async function loadAllJSON(urlMap) {
  const entries = Object.entries(urlMap);
  const results = await Promise.all(entries.map(([, url]) => loadJSON(url)));
  const out = {};
  entries.forEach(([key], i) => {
    out[key] = results[i];
  });
  return out;
}
