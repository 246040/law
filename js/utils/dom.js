/**
 * 法考通 · DOM 工具函数
 */

/** 单元素选择器 */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);

/** 多元素选择器 */
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** 设置元素 innerHTML */
export function html(el, content) {
  if (typeof el === 'string') el = $(el);
  if (el) el.innerHTML = content;
}

/** 创建元素 */
export function create(tag, attrs = {}, children = '') {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') el.className = value;
    else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key.startsWith('on')) {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  }
  if (typeof children === 'string') {
    el.innerHTML = children;
  } else if (children instanceof Node) {
    el.appendChild(children);
  } else if (Array.isArray(children)) {
    children.forEach(child => {
      if (typeof child === 'string') {
        el.insertAdjacentHTML('beforeend', child);
      } else if (child instanceof Node) {
        el.appendChild(child);
      }
    });
  }
  return el;
}

/** 事件委托 */
export function on(parent, event, selector, handler) {
  if (typeof parent === 'string') parent = $(parent);
  parent.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target && parent.contains(target)) {
      handler(e, target);
    }
  });
}

/** 显示/隐藏 */
export function show(el) {
  if (typeof el === 'string') el = $(el);
  if (el) el.style.display = '';
}

export function hide(el) {
  if (typeof el === 'string') el = $(el);
  if (el) el.style.display = 'none';
}

/** 切换 class */
export function toggleClass(el, cls, force) {
  if (typeof el === 'string') el = $(el);
  if (el) el.classList.toggle(cls, force);
}
