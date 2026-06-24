/**
 * 法考通 · 键盘快捷键
 * 
 * 面向程序员用户的高效键盘操作：
 * - A/B/C/D: 选择选项
 * - Enter: 确认答案 / 下一题
 * - 1-7: 切换页面（数字键导航）
 * - ?: 显示快捷键帮助
 */

const SHORTCUTS = {
  // 刷题页面
  practice: {
    'a': () => clickOption(0),
    'b': () => clickOption(1),
    'c': () => clickOption(2),
    'd': () => clickOption(3),
    'Enter': () => clickButton('#btnSubmit') || clickButton('#btnNext'),
    'n': () => clickButton('#btnNext'),
  },
  // 速记卡片
  flashcards: {
    ' ': () => clickElement('.flashcard'), // 空格翻转
    '1': () => clickButton('[data-level="hard"]'),
    '2': () => clickButton('[data-level="ok"]'),
    '3': () => clickButton('[data-level="easy"]'),
  },
  // 模拟考试
  exam: {
    'a': () => clickOption(0),
    'b': () => clickOption(1),
    'c': () => clickOption(2),
    'd': () => clickOption(3),
    'ArrowLeft': () => clickButton('#btnExamPrev'),
    'ArrowRight': () => clickButton('#btnExamNext'),
    'm': () => clickButton('#btnExamMark'),
    'Enter': () => clickButton('#btnExamSubmitQ'),
  },
  // 全局页面导航
  global: {
    '!1': () => window.switchPage?.('dashboard'),
    '!2': () => window.switchPage?.('practice'),
    '!3': () => window.switchPage?.('exam'),
    '!4': () => window.switchPage?.('flashcards'),
    '!5': () => window.switchPage?.('mistakes'),
    '!6': () => window.switchPage?.('knowledge'),
    '!7': () => window.switchPage?.('laws'),
    '!8': () => window.switchPage?.('settings'),
    '?': () => toggleHelp(),
  },
};

let currentContext = 'dashboard';
let helpVisible = false;

/**
 * 初始化键盘快捷键
 */
export function initKeyboard() {
  document.addEventListener('keydown', handleKeydown);
}

/**
 * 设置当前页面上下文
 * @param {string} page - 当前页面名称
 */
export function setContext(page) {
  currentContext = page;
}

function handleKeydown(e) {
  // 忽略输入框中的按键
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
    return;
  }

  // Alt+数字 = 页面导航
  if (e.altKey && e.key >= '1' && e.key <= '8') {
    e.preventDefault();
    const handler = SHORTCUTS.global[`!${e.key}`];
    if (handler) handler();
    return;
  }

  // ? 显示帮助
  if (e.key === '?' && !e.ctrlKey && !e.altKey) {
    e.preventDefault();
    SHORTCUTS.global['?']();
    return;
  }

  // 上下文相关快捷键
  const contextShortcuts = SHORTCUTS[currentContext];
  if (contextShortcuts && contextShortcuts[e.key]) {
    e.preventDefault();
    contextShortcuts[e.key]();
  }
}

function clickOption(index) {
  const options = document.querySelectorAll('.option-item');
  if (options[index]) options[index].click();
}

function clickButton(selector) {
  const btn = document.querySelector(selector);
  if (btn && !btn.disabled) {
    btn.click();
    return true;
  }
  return false;
}

function clickElement(selector) {
  const el = document.querySelector(selector);
  if (el) el.click();
}

function toggleHelp() {
  helpVisible = !helpVisible;
  let modal = document.getElementById('keyboardHelpModal');

  if (!helpVisible && modal) {
    modal.remove();
    return;
  }

  if (helpVisible) {
    modal = document.createElement('div');
    modal.id = 'keyboardHelpModal';
    modal.style.cssText = `
      position:fixed; inset:0; z-index:9999;
      display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,0.7); backdrop-filter:blur(4px);
    `;
    modal.innerHTML = `
      <div style="background:var(--bg-card,#1a1f2e); border:1px solid rgba(255,255,255,0.1);
        border-radius:16px; padding:32px; max-width:480px; width:90%; color:rgba(255,255,255,0.85);
        font-family:Inter,sans-serif;">
        <h3 style="margin:0 0 20px; color:var(--accent-gold,#d4a84b); font-size:18px;">⌨️ 键盘快捷键</h3>
        <div style="display:grid; gap:12px; font-size:14px;">
          <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
            <strong>刷题模式</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>选择选项</span><kbd style="background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:4px;">A / B / C / D</kbd>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>确认 / 下一题</span><kbd style="background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:4px;">Enter</kbd>
          </div>
          <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding:8px 0;">
            <strong>速记卡片</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>翻转卡片</span><kbd style="background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:4px;">Space</kbd>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>困难/还行/掌握</span><kbd style="background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:4px;">1 / 2 / 3</kbd>
          </div>
          <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding:8px 0;">
            <strong>模拟考试</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>选择选项</span><kbd style="background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:4px;">A / B / C / D</kbd>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>上/下一题</span><kbd style="background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:4px;">← / →</kbd>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>标记当前题</span><kbd style="background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:4px;">M</kbd>
          </div>
          <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding:8px 0;">
            <strong>全局导航</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>切换页面</span><kbd style="background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:4px;">Alt + 1~7</kbd>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>显示此帮助</span><kbd style="background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:4px;">?</kbd>
          </div>
        </div>
        <button onclick="document.getElementById('keyboardHelpModal').remove()" 
          style="margin-top:20px; width:100%; padding:10px; border:none; border-radius:8px;
          background:var(--accent-gold,#d4a84b); color:#000; font-weight:600; cursor:pointer;">
          知道了
        </button>
      </div>
    `;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) { modal.remove(); helpVisible = false; }
    });
    document.body.appendChild(modal);
  }
}
