/**
 * 法考通关助手 - 判断树模块
 */

const Tree = {
  expandedNodes: new Set(['root']),

  render() {
    const page = document.getElementById('page-tree');
    if (!page) return;

    page.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">🌳 判断树</h1>
        <p class="page-subtitle">财产犯罪罪名识别决策模型</p>
      </div>

      <div class="card mb-md animate-in">
        <p style="color: var(--text-secondary); font-size: var(--text-sm); line-height: 1.7;">
          点击节点展开/收起分支。每个终端节点关联了对应的练习题。
          <br>判断财产犯罪的核心流程：先看财物在谁手里 → 再看行为人怎么取得 → 最后判断罪名。
        </p>
      </div>

      <div class="tree-container animate-in">
        ${this.renderNode(DECISION_TREE, 0)}
      </div>

      <!-- 转化型抢劫特别说明 -->
      <div class="card mt-lg animate-in" style="border-left: 4px solid var(--color-wrong);">
        <h3 style="color: var(--color-wrong); margin-bottom: var(--space-sm);">
          ⚡ ${TRANSFORM_ROBBERY_RULE.title}
        </h3>
        <p style="color: var(--text-secondary); font-size: var(--text-sm); margin-bottom: var(--space-md);">
          ${TRANSFORM_ROBBERY_RULE.description}
        </p>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${TRANSFORM_ROBBERY_RULE.conditions.map(c => `
            <span style="color: var(--text-secondary); font-size: var(--text-sm);">
              ▸ ${c}
            </span>
          `).join('')}
        </div>
        ${TRANSFORM_ROBBERY_RULE.relatedQuestions.length > 0 ? `
          <div class="mt-md">
            <button class="btn btn-sm btn-secondary"
                    onclick="Tree.goToQuestion('${TRANSFORM_ROBBERY_RULE.relatedQuestions[0]}')">
              📝 练习相关题目
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  renderNode(node, depth) {
    if (!node) return '';

    const isExpanded = this.expandedNodes.has(node.id);
    const hasBranches = node.branches && node.branches.length > 0;
    const isLeaf = !hasBranches;

    let nodeClass = 'tree-node';
    if (isLeaf) nodeClass += ' highlight';

    return `
      <div style="margin-left: ${depth * 16}px;">
        <div class="${nodeClass}" onclick="Tree.toggle('${node.id}')">
          <div class="question">
            ${hasBranches ? (isExpanded ? '▼' : '▶') : '●'}
            ${node.question}
          </div>
          ${node.answer ? `<div class="answer">${node.answer}</div>` : ''}
          ${isLeaf && node.relatedQuestions && node.relatedQuestions.length > 0 ? `
            <div class="mt-sm">
              <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); Tree.practiceRelated('${node.id}')">
                📝 练习 ${node.relatedQuestions.length} 道题
              </button>
            </div>
          ` : ''}
        </div>

        ${hasBranches && isExpanded ? `
          <div class="tree-branch">
            ${node.branches.map(branch => `
              <div class="tree-branch-label">${branch.label}</div>
              ${this.renderNode(branch.node, depth + 1)}
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  toggle(nodeId) {
    if (this.expandedNodes.has(nodeId)) {
      this.expandedNodes.delete(nodeId);
    } else {
      this.expandedNodes.add(nodeId);
    }
    this.render();
  },

  practiceRelated(nodeId) {
    const questions = this.findRelatedQuestions(DECISION_TREE, nodeId);
    if (questions.length > 0) {
      Quiz.start(questions);
      App.navigate('quiz');
    }
  },

  findRelatedQuestions(node, targetId) {
    if (!node) return [];
    if (node.id === targetId) return node.relatedQuestions || [];
    if (node.branches) {
      for (const branch of node.branches) {
        const result = this.findRelatedQuestions(branch.node, targetId);
        if (result.length > 0) return result;
      }
    }
    return [];
  },

  goToQuestion(questionId) {
    Quiz.start([questionId]);
    App.navigate('quiz');
  }
};
