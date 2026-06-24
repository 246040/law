/**
 * 法考通 · 学习数据可视化
 * 
 * 使用 Canvas API 绘制学习曲线，零依赖。
 * 支持：折线图（正确率趋势）、雷达图（学科能力）、热力图（学习频率）
 */

/**
 * 绘制正确率趋势折线图
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{date: string, rate: number}>} data - 每日正确率数据
 */
export function drawTrendLine(canvas, data) {
  if (!canvas || !data || data.length < 2) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;
  const padding = { top: 30, right: 20, bottom: 40, left: 50 };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;

  // 清空
  ctx.clearRect(0, 0, W, H);

  // 背景网格
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(W - padding.right, y);
    ctx.stroke();
  }

  // Y 轴标签 (0% - 100%)
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.fillText(`${100 - i * 25}%`, padding.left - 8, y + 4);
  }

  // X 轴标签（日期）
  ctx.textAlign = 'center';
  const step = Math.max(1, Math.floor(data.length / 7));
  data.forEach((d, i) => {
    if (i % step === 0 || i === data.length - 1) {
      const x = padding.left + (i / (data.length - 1)) * chartW;
      ctx.fillText(d.date.slice(5), x, H - padding.bottom + 18);
    }
  });

  // 绘制折线
  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH * (1 - d.rate / 100),
  }));

  // 渐变填充
  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
  gradient.addColorStop(0, 'rgba(212, 168, 75, 0.3)');
  gradient.addColorStop(1, 'rgba(212, 168, 75, 0)');

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    // 贝塞尔曲线平滑
    const cp1x = (points[i - 1].x + points[i].x) / 2;
    const cp1y = points[i - 1].y;
    const cp2x = cp1x;
    const cp2y = points[i].y;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
  }

  // 填充区域
  ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
  ctx.lineTo(points[0].x, padding.top + chartH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // 绘制线条
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const cp1x = (points[i - 1].x + points[i].x) / 2;
    const cp1y = points[i - 1].y;
    const cp2x = cp1x;
    const cp2y = points[i].y;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
  }
  ctx.strokeStyle = '#d4a84b';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 绘制数据点
  points.forEach((p, i) => {
    if (i % step === 0 || i === points.length - 1) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#d4a84b';
      ctx.fill();
      ctx.strokeStyle = '#0b0f1a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  // 标题
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '13px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('正确率趋势', padding.left, 18);
}

/**
 * 绘制学科雷达图
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{name: string, score: number}>} subjects - 各学科得分 (0-100)
 */
export function drawRadar(canvas, subjects) {
  if (!canvas || !subjects || subjects.length < 3) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;
  const cx = W / 2;
  const cy = H / 2 + 10;
  const radius = Math.min(W, H) * 0.35;
  const n = subjects.length;
  const angleStep = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, W, H);

  // 背景同心圆
  for (let level = 1; level <= 4; level++) {
    const r = (radius / 4) * level;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 轴线
  for (let i = 0; i < n; i++) {
    const angle = angleStep * i - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.stroke();
  }

  // 数据多边形
  ctx.beginPath();
  subjects.forEach((s, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const r = (s.score / 100) * radius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(212, 168, 75, 0.2)';
  ctx.fill();
  ctx.strokeStyle = '#d4a84b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 数据点
  subjects.forEach((s, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const r = (s.score / 100) * radius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#d4a84b';
    ctx.fill();
  });

  // 标签
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  subjects.forEach((s, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const labelR = radius + 18;
    const x = cx + labelR * Math.cos(angle);
    const y = cy + labelR * Math.sin(angle);
    ctx.fillText(s.name, x, y + 4);
  });

  // 标题
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '13px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('学科能力雷达', 12, 18);
}

/**
 * 绘制学习热力图（GitHub Contribution 风格）
 * @param {HTMLCanvasElement} canvas
 * @param {Object<string, number>} data - { 'YYYY-MM-DD': count, ... }
 * @param {number} weeks - 显示周数 (默认 12)
 */
export function drawHeatmap(canvas, data, weeks = 12) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const cellSize = 14;
  const gap = 3;
  const paddingLeft = 30;
  const paddingTop = 30;

  ctx.clearRect(0, 0, rect.height, W);

  // 计算日期范围
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - weeks * 7 + 1);
  // 对齐到周一
  startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7));

  // 颜色等级
  const colors = [
    'rgba(255,255,255,0.04)', // 0
    'rgba(212, 168, 75, 0.2)', // 1-5
    'rgba(212, 168, 75, 0.4)', // 6-15
    'rgba(212, 168, 75, 0.65)', // 16-30
    'rgba(212, 168, 75, 0.9)', // 30+
  ];

  function getColor(count) {
    if (!count || count === 0) return colors[0];
    if (count <= 5) return colors[1];
    if (count <= 15) return colors[2];
    if (count <= 30) return colors[3];
    return colors[4];
  }

  // 星期标签
  const days = ['一', '', '三', '', '五', '', '日'];
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'right';
  days.forEach((d, i) => {
    if (d) {
      ctx.fillText(d, paddingLeft - 6, paddingTop + i * (cellSize + gap) + cellSize - 2);
    }
  });

  // 绘制格子
  let currentDate = new Date(startDate);
  for (let week = 0; week < weeks; week++) {
    for (let day = 0; day < 7; day++) {
      if (currentDate > today) break;

      const key = currentDate.toISOString().slice(0, 10);
      const count = data[key] || 0;
      const x = paddingLeft + week * (cellSize + gap);
      const y = paddingTop + day * (cellSize + gap);

      ctx.fillStyle = getColor(count);
      ctx.beginPath();
      ctx.roundRect(x, y, cellSize, cellSize, 2);
      ctx.fill();

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // 标题
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '13px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('学习热力图', paddingLeft, 18);

  // 图例
  const legendX = W - 120;
  const legendY = 12;
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('少', legendX, legendY);
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(legendX + 16 + i * 16, legendY - 9, 12, 12);
  });
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('多', legendX + 16 + colors.length * 16 + 4, legendY);
}

/**
 * 绘制学科对比柱状图
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{name: string, rate: number, count: number}>} data - 各学科正确率和做题量
 */
export function drawBarChart(canvas, data) {
  if (!canvas || !data || data.length === 0) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;
  const padding = { top: 35, right: 20, bottom: 50, left: 45 };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;

  ctx.clearRect(0, 0, W, H);

  // 水平参考线
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(W - padding.right, y);
    ctx.stroke();
  }

  // 60% 警戒线
  const warnY = padding.top + chartH * (1 - 0.6);
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(padding.left, warnY);
  ctx.lineTo(W - padding.right, warnY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 60% 标签
  ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('60%', padding.left - 40, warnY + 3);

  // Y 轴标签
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.fillText(`${100 - i * 25}%`, padding.left - 8, y + 4);
  }

  // 柱形
  const barCount = data.length;
  const barGap = Math.max(6, chartW * 0.05);
  const barWidth = Math.min(40, (chartW - barGap * (barCount + 1)) / barCount);
  const totalBarsWidth = barCount * barWidth + (barCount + 1) * barGap;
  const offsetX = padding.left + (chartW - totalBarsWidth) / 2 + barGap;

  data.forEach((item, i) => {
    const x = offsetX + i * (barWidth + barGap);
    const barH = (item.rate / 100) * chartH;
    const y = padding.top + chartH - barH;

    // 柱形颜色：<60% 红色，60-80% 金色，>80% 绿色
    let color, colorAlpha;
    if (item.rate < 60) {
      color = 'rgba(239, 68, 68,';
      colorAlpha = '0.75)';
    } else if (item.rate < 80) {
      color = 'rgba(212, 168, 75,';
      colorAlpha = '0.75)';
    } else {
      color = 'rgba(34, 197, 94,';
      colorAlpha = '0.75)';
    }

    // 渐变柱形
    const barGradient = ctx.createLinearGradient(x, y, x, padding.top + chartH);
    barGradient.addColorStop(0, color + colorAlpha);
    barGradient.addColorStop(1, color + '0.2)');

    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
    ctx.fillStyle = barGradient;
    ctx.fill();

    // 顶部数值
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${item.rate}%`, x + barWidth / 2, y - 6);

    // 底部学科名
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.name.slice(0, 3), x + barWidth / 2, padding.top + chartH + 16);

    // 做题量
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '9px Inter, sans-serif';
    ctx.fillText(`${item.count}题`, x + barWidth / 2, padding.top + chartH + 30);
  });

  // 标题
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '13px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('学科正确率对比', padding.left, 18);
}
