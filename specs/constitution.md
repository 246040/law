# 法考通关助手 - Constitution（架构宪法）

## 项目愿景

为非法学背景、有强逻辑能力的考生（如程序员）提供一个**工程化法考通关工具**。
核心理念：法考 = 规则识别 + 高频记忆 + 限时做题，不是学术研究。

## 产品定位

| 维度 | 定义 |
|------|------|
| 目标用户 | 非法学本科、有逻辑训练基础的法考考生 |
| 核心场景 | 刷题 → 判分 → 看解析 → 错题回炉 → 限时模拟 |
| 产品形态 | Web 单页应用，支持移动端 |
| 差异化 | 用"判断树"而非死记硬背；用软件思维类比法律概念 |

## 技术架构约束

### 必须遵守
- **纯前端**：HTML + CSS + JavaScript，无后端依赖
- **离线可用**：所有题库内置，LocalStorage 存进度
- **零依赖**：不引入任何第三方库或框架
- **单文件可部署**：最终可合并为单个 HTML 文件
- **响应式**：移动端优先，桌面端适配

### 禁止
- 不使用 React/Vue/Angular 等框架
- 不使用 Tailwind/Bootstrap 等 CSS 框架
- 不使用 Node.js 构建工具
- 不引入外部 CDN 依赖
- 不使用后端数据库

## 数据模型约束

### 题目结构
```json
{
  "id": "string",
  "category": "刑法/民法/民诉/...",
  "subcategory": "财产犯罪/共同犯罪/...",
  "type": "single|multiple",
  "stem": "题干文本",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "answer": "B",
  "analysis": "解析文本",
  "trap": "陷阱说明",
  "rule": "核心规则",
  "lawRef": "法条依据",
  "difficulty": 1-5,
  "tags": ["盗窃", "诈骗", "处分意识"]
}
```

### 用户进度结构
```json
{
  "userId": "local",
  "history": [
    {
      "questionId": "string",
      "userAnswer": "B",
      "correct": true,
      "timestamp": "ISO8601",
      "timeSpent": 30
    }
  ],
  "wrongBook": ["questionId1", "questionId2"],
  "stats": {
    "totalDone": 100,
    "correctRate": 0.72,
    "byCategory": {}
  }
}
```

## 设计系统约束

### 配色方案
- 主背景：深色 (#0f1419)
- 卡片背景：(#1a2332)
- 主强调色：法律金 (#d4a853)
- 正确：翠绿 (#4ecdc4)
- 错误：珊瑚红 (#ff6b6b)
- 文字：浅灰 (#e8e8e8)

### 字体
- 正文：系统字体栈（-apple-system, "Microsoft YaHei", sans-serif）
- 代码/法条：等宽字体

### 间距
- 基础单位：8px
- 组件间距：16px / 24px / 32px

## 功能边界

### MVP 必须包含
1. 题库浏览和做题
2. 即时判分和解析
3. 错题本
4. 做题统计
5. 判断树/决策模型可视化

### 未来迭代（不在本次范围）
- AI 智能出题
- 社区讨论
- 视频课程
- 后端同步

## 质量标准
- Lighthouse Performance > 90
- 首屏加载 < 1s
- 所有交互响应 < 100ms
- 支持 Chrome/Safari/Firefox 最新版
- 无障碍：WCAG 2.1 AA 级别
