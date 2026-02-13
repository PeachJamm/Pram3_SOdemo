"use strict";
// =====================================================
// PRAM3 ERP Frontend - SO SPA Component
// 销售订单审批生命周期SPA组件
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOSPAStyles = exports.SOSPAComponent = exports.ProcessNodeStatus = exports.ProcessNodeType = void 0;
const sales_order_types_1 = require("../../domains/sales/models/sales-order.types");
/**
 * 流程节点类型
 */
var ProcessNodeType;
(function (ProcessNodeType) {
    ProcessNodeType["CUSTOM_FORM"] = "CUSTOM_FORM";
    ProcessNodeType["MAIN_FORM"] = "MAIN_FORM";
    ProcessNodeType["APPROVAL"] = "APPROVAL";
    ProcessNodeType["LOGIC_GATE"] = "LOGIC_GATE";
})(ProcessNodeType || (exports.ProcessNodeType = ProcessNodeType = {}));
/**
 * 流程节点状态
 */
var ProcessNodeStatus;
(function (ProcessNodeStatus) {
    ProcessNodeStatus["PENDING"] = "PENDING";
    ProcessNodeStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ProcessNodeStatus["COMPLETED"] = "COMPLETED";
    ProcessNodeStatus["FAILED"] = "FAILED";
    ProcessNodeStatus["SKIPPED"] = "SKIPPED";
})(ProcessNodeStatus || (exports.ProcessNodeStatus = ProcessNodeStatus = {}));
/**
 * SO SPA 组件
 */
class SOSPAComponent {
    constructor(salesOrder, callbacks) {
        this.state = {
            salesOrder,
            currentNodeId: this.getLatestProcessNode(salesOrder),
            isActive: true,
            processDefinition: this.buildProcessDefinition(salesOrder),
            approvalHistory: [],
            comments: [],
            isDirty: false,
        };
        this.onSave = callbacks?.onSave;
        this.onSubmit = callbacks?.onSubmit;
        this.onRollback = callbacks?.onRollback;
        this.onOverride = callbacks?.onOverride;
    }
    /**
     * 构建流程定义
     */
    buildProcessDefinition(salesOrder) {
        const nodes = [
            {
                id: 'node-order-create',
                type: ProcessNodeType.MAIN_FORM,
                label: '创建订单',
                status: ProcessNodeStatus.COMPLETED,
                completedAt: salesOrder.createdAt,
                rollbackable: false,
                formKey: 'order-create-form',
            },
            {
                id: 'node-order-review',
                type: ProcessNodeType.CUSTOM_FORM,
                label: '订单审核',
                status: this.getStatusForNode(salesOrder, 'node-order-review'),
                rollbackable: true,
                formKey: 'order-review-form',
            },
            {
                id: 'node-approval-level1',
                type: ProcessNodeType.APPROVAL,
                label: '部门经理审批',
                status: this.getApprovalStatus(salesOrder, sales_order_types_1.ApprovalLevel.LEVEL_1),
                approver: this.getApprover(salesOrder, sales_order_types_1.ApprovalLevel.LEVEL_1),
                comment: this.getApprovalComment(salesOrder, sales_order_types_1.ApprovalLevel.LEVEL_1),
                rollbackable: true,
                formKey: 'dept-manager-approval-form',
            },
        ];
        // 根据金额添加二级审批
        if (salesOrder.totalAmount >= 10000) {
            nodes.push({
                id: 'node-approval-level2',
                type: ProcessNodeType.APPROVAL,
                label: '总监审批',
                status: this.getApprovalStatus(salesOrder, sales_order_types_1.ApprovalLevel.LEVEL_2),
                approver: this.getApprover(salesOrder, sales_order_types_1.ApprovalLevel.LEVEL_2),
                comment: this.getApprovalComment(salesOrder, sales_order_types_1.ApprovalLevel.LEVEL_2),
                rollbackable: true,
                formKey: 'director-approval-form',
            });
        }
        // 根据金额添加三级审批
        if (salesOrder.totalAmount >= 100000) {
            nodes.push({
                id: 'node-approval-level3',
                type: ProcessNodeType.APPROVAL,
                label: 'VP审批',
                status: this.getApprovalStatus(salesOrder, sales_order_types_1.ApprovalLevel.LEVEL_3),
                approver: this.getApprover(salesOrder, sales_order_types_1.ApprovalLevel.LEVEL_3),
                comment: this.getApprovalComment(salesOrder, sales_order_types_1.ApprovalLevel.LEVEL_3),
                rollbackable: true,
                formKey: 'vp-approval-form',
            });
        }
        // 自动处理节点
        nodes.push({
            id: 'node-finance',
            type: ProcessNodeType.CUSTOM_FORM,
            label: '财务处理',
            status: this.getAutoProcessStatus(salesOrder, 'finance'),
            rollbackable: false,
            formKey: 'finance-form',
        }, {
            id: 'node-inventory',
            type: ProcessNodeType.CUSTOM_FORM,
            label: '库存预留',
            status: this.getAutoProcessStatus(salesOrder, 'inventory'),
            rollbackable: false,
            formKey: 'inventory-form',
        }, {
            id: 'node-notification',
            type: ProcessNodeType.CUSTOM_FORM,
            label: '客户通知',
            status: this.getAutoProcessStatus(salesOrder, 'notification'),
            rollbackable: false,
            formKey: 'notification-form',
        }, {
            id: 'node-complete',
            type: ProcessNodeType.MAIN_FORM,
            label: '订单完成',
            status: salesOrder.status === sales_order_types_1.SalesOrderStatus.COMPLETED
                ? ProcessNodeStatus.COMPLETED
                : ProcessNodeStatus.PENDING,
            rollbackable: false,
        });
        // 构建连线
        const connections = [];
        for (let i = 0; i < nodes.length - 1; i++) {
            connections.push({
                id: `conn-${nodes[i].id}-${nodes[i + 1].id}`,
                fromNodeId: nodes[i].id,
                toNodeId: nodes[i + 1].id,
            });
        }
        return { nodes, connections };
    }
    /**
     * 获取最新流程节点ID
     */
    getLatestProcessNode(salesOrder) {
        if (salesOrder.status === sales_order_types_1.SalesOrderStatus.COMPLETED) {
            return 'node-complete';
        }
        if (salesOrder.status === sales_order_types_1.SalesOrderStatus.PROCESSING) {
            return 'node-notification';
        }
        if (salesOrder.status === sales_order_types_1.SalesOrderStatus.APPROVED) {
            return 'node-finance';
        }
        if (salesOrder.status === sales_order_types_1.SalesOrderStatus.PENDING_APPROVAL) {
            const approvalLevel = salesOrder.approvalLevel;
            if (approvalLevel === sales_order_types_1.ApprovalLevel.LEVEL_1)
                return 'node-approval-level1';
            if (approvalLevel === sales_order_types_1.ApprovalLevel.LEVEL_2)
                return 'node-approval-level2';
            if (approvalLevel === sales_order_types_1.ApprovalLevel.LEVEL_3)
                return 'node-approval-level3';
        }
        return 'node-order-review';
    }
    /**
     * 获取节点状态
     */
    getStatusForNode(salesOrder, nodeId) {
        const statusOrder = [
            sales_order_types_1.SalesOrderStatus.DRAFT,
            sales_order_types_1.SalesOrderStatus.PENDING_APPROVAL,
            sales_order_types_1.SalesOrderStatus.APPROVED,
            sales_order_types_1.SalesOrderStatus.PROCESSING,
            sales_order_types_1.SalesOrderStatus.COMPLETED,
        ];
        const currentIndex = statusOrder.indexOf(salesOrder.status);
        switch (nodeId) {
            case 'node-order-create':
                return ProcessNodeStatus.COMPLETED;
            case 'node-order-review':
                return currentIndex >= 0 ? ProcessNodeStatus.IN_PROGRESS : ProcessNodeStatus.PENDING;
            default:
                return ProcessNodeStatus.PENDING;
        }
    }
    /**
     * 获取审批状态
     */
    getApprovalStatus(salesOrder, level) {
        if (salesOrder.approvalLevel !== level) {
            return ProcessNodeStatus.PENDING;
        }
        if (salesOrder.status === sales_order_types_1.SalesOrderStatus.REJECTED) {
            return ProcessNodeStatus.FAILED;
        }
        if (salesOrder.status === sales_order_types_1.SalesOrderStatus.APPROVED) {
            // 如果有更高级别审批，则当前级别已完成
            if (level === sales_order_types_1.ApprovalLevel.LEVEL_1 && salesOrder.totalAmount >= 10000) {
                return ProcessNodeStatus.COMPLETED;
            }
            if (level === sales_order_types_1.ApprovalLevel.LEVEL_2 && salesOrder.totalAmount >= 100000) {
                return ProcessNodeStatus.COMPLETED;
            }
            // 如果没有更高级别，则当前级别就是最终状态
            if (level === sales_order_types_1.ApprovalLevel.LEVEL_3 ||
                (level === sales_order_types_1.ApprovalLevel.LEVEL_2 && salesOrder.totalAmount < 100000) ||
                (level === sales_order_types_1.ApprovalLevel.LEVEL_1 && salesOrder.totalAmount < 10000)) {
                return ProcessNodeStatus.COMPLETED;
            }
        }
        if (salesOrder.status === sales_order_types_1.SalesOrderStatus.PENDING_APPROVAL) {
            return ProcessNodeStatus.IN_PROGRESS;
        }
        return ProcessNodeStatus.PENDING;
    }
    /**
     * 获取审批人
     */
    getApprover(salesOrder, level) {
        if (salesOrder.approvalLevel === level && salesOrder.approver) {
            return salesOrder.approver;
        }
        return undefined;
    }
    /**
     * 获取审批意见
     */
    getApprovalComment(salesOrder, level) {
        if (salesOrder.approvalLevel === level && salesOrder.approvalComment) {
            return salesOrder.approvalComment;
        }
        return undefined;
    }
    /**
     * 获取自动处理状态
     */
    getAutoProcessStatus(salesOrder, process) {
        if (salesOrder.status === sales_order_types_1.SalesOrderStatus.COMPLETED) {
            return ProcessNodeStatus.COMPLETED;
        }
        if (salesOrder.status === sales_order_types_1.SalesOrderStatus.PROCESSING) {
            if (process === 'notification')
                return ProcessNodeStatus.IN_PROGRESS;
            if (process === 'inventory')
                return ProcessNodeStatus.COMPLETED;
            if (process === 'finance')
                return ProcessNodeStatus.COMPLETED;
        }
        if (salesOrder.status === sales_order_types_1.SalesOrderStatus.APPROVED) {
            return ProcessNodeStatus.IN_PROGRESS;
        }
        return ProcessNodeStatus.PENDING;
    }
    /**
     * 获取当前节点
     */
    getCurrentNode() {
        return this.state.processDefinition.nodes.find(n => n.id === this.state.currentNodeId) || null;
    }
    /**
     * 渲染SPA HTML
     */
    render() {
        const { salesOrder, isActive, processDefinition, isDirty } = this.state;
        if (!salesOrder) {
            return '<div class="so-spa-error">订单不存在</div>';
        }
        return `
      <div class="so-spa" data-order-id="${salesOrder.id}" data-is-active="${isActive}">
        <!-- 顶部状态栏 -->
        <div class="so-spa-header">
          <div class="header-left">
            <span class="so-id">SO-${salesOrder.orderNumber}</span>
            <span class="so-status status-${salesOrder.status.toLowerCase()}">${this.getStatusLabel(salesOrder.status)}</span>
            <label class="toggle-switch">
              <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleActive(this)" />
              <span class="toggle-slider"></span>
              <span class="toggle-label">${isActive ? 'Active' : 'Inactive'}</span>
            </label>
          </div>
          <div class="header-actions">
            <button class="btn btn-override" onclick="showOverrideModal()" ${!isActive ? 'disabled' : ''}>
              Override
            </button>
            <button class="btn btn-comment" onclick="showComments()">
              <span class="comment-icon">💬</span>
              ${this.state.comments.length > 0 ? `<span class="comment-badge">${this.state.comments.length}</span>` : ''}
            </button>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="so-spa-progress">
          <div class="progress-track">
            ${this.renderProgressNodes(processDefinition.nodes)}
            ${this.renderConnections(processDefinition.connections)}
          </div>
          <div class="rollback-section">
            <button class="btn btn-rollback" onclick="rollback()" ${!this.canRollback() ? 'disabled' : ''}>
              ← 回退
            </button>
          </div>
        </div>

        <!-- 主表单区域 -->
        <div class="so-spa-content">
          ${this.renderMainForm()}
        </div>

        <!-- 底部操作栏 -->
        <div class="so-spa-footer">
          <div class="footer-left">
            <span class="last-updated">最后更新: ${salesOrder.updatedAt.toLocaleString()}</span>
            ${isDirty ? '<span class="dirty-indicator">● 有未保存的更改</span>' : ''}
          </div>
          <div class="footer-actions">
            <button class="btn btn-save" onclick="saveData()" ${!isActive ? 'disabled' : ''}>
              Save
            </button>
            <button class="btn btn-submit" onclick="submitData()" ${!isActive ? 'disabled' : ''}>
              Submit
            </button>
          </div>
        </div>
      </div>

      <!-- Override 模态框 -->
      <div id="override-modal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Override Reason</h3>
            <button class="modal-close" onclick="closeOverrideModal()">×</button>
          </div>
          <div class="modal-body">
            <textarea id="override-reason" placeholder="请输入Override原因..." rows="4"></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn btn-cancel" onclick="closeOverrideModal()">Cancel</button>
            <button class="btn btn-confirm" onclick="confirmOverride()">Confirm</button>
          </div>
        </div>
      </div>

      <!-- Comments 面板 -->
      <div id="comments-panel" class="panel" style="display: none;">
        <div class="panel-header">
          <h3>Comments</h3>
          <button class="panel-close" onclick="closeComments()">×</button>
        </div>
        <div class="panel-body">
          ${this.renderComments()}
        </div>
        <div class="panel-footer">
          <input type="text" id="new-comment" placeholder="添加评论..." />
          <button class="btn btn-add-comment" onclick="addComment()">Add</button>
        </div>
      </div>
    `;
    }
    /**
     * 渲染进度节点
     */
    renderProgressNodes(nodes) {
        return nodes.map(node => {
            const statusClass = this.getStatusClass(node.status);
            const shapeClass = this.getShapeClass(node.type);
            const isCurrent = node.id === this.state.currentNodeId;
            return `
        <div class="progress-node ${shapeClass} ${statusClass} ${isCurrent ? 'current' : ''}"
             data-node-id="${node.id}"
             onclick="navigateToNode('${node.id}')"
             title="${node.label}">
          <span class="node-icon">${this.getNodeIcon(node.type)}</span>
          <span class="node-label">${node.label}</span>
          ${node.status === ProcessNodeStatus.IN_PROGRESS ? '<span class="pulse-indicator"></span>' : ''}
        </div>
      `;
        }).join('');
    }
    /**
     * 渲染连线
     */
    renderConnections(connections) {
        return connections.map(conn => `
      <div class="progress-connection" data-from="${conn.fromNodeId}" data-to="${conn.toNodeId}"></div>
    `).join('');
    }
    /**
     * 渲染主表单
     */
    renderMainForm() {
        const currentNode = this.getCurrentNode();
        if (!currentNode) {
            return '<div class="form-placeholder">暂无数据进行编辑</div>';
        }
        return `
      <div class="main-form-container">
        <div class="form-header">
          <h2>${currentNode.label}</h2>
          ${currentNode.approver ? `<span class="approver-info">审批人: ${currentNode.approver}</span>` : ''}
          ${currentNode.comment ? `<div class="approval-comment">意见: ${currentNode.comment}</div>` : ''}
        </div>
        <div class="form-body" id="main-form-body">
          <!-- 动态表单内容将通过API加载 -->
          <div class="form-loading">加载中...</div>
        </div>
      </div>
    `;
    }
    /**
     * 渲染评论列表
     */
    renderComments() {
        if (this.state.comments.length === 0) {
            return '<div class="no-comments">暂无评论</div>';
        }
        return this.state.comments.map(comment => `
      <div class="comment-item" data-comment-id="${comment.id}">
        <div class="comment-header">
          <span class="comment-user">${comment.userName}</span>
          <span class="comment-time">${comment.timestamp.toLocaleString()}</span>
        </div>
        <div class="comment-content">${comment.content}</div>
      </div>
    `).join('');
    }
    /**
     * 获取状态标签
     */
    getStatusLabel(status) {
        const labels = {
            [sales_order_types_1.SalesOrderStatus.DRAFT]: '草稿',
            [sales_order_types_1.SalesOrderStatus.PENDING_APPROVAL]: '待审批',
            [sales_order_types_1.SalesOrderStatus.APPROVED]: '已审批',
            [sales_order_types_1.SalesOrderStatus.REJECTED]: '已拒绝',
            [sales_order_types_1.SalesOrderStatus.CANCELLED]: '已取消',
            [sales_order_types_1.SalesOrderStatus.PROCESSING]: '处理中',
            [sales_order_types_1.SalesOrderStatus.COMPLETED]: '已完成',
        };
        return labels[status] || status;
    }
    /**
     * 获取状态CSS类
     */
    getStatusClass(status) {
        const classes = {
            [ProcessNodeStatus.PENDING]: 'status-pending',
            [ProcessNodeStatus.IN_PROGRESS]: 'status-in-progress',
            [ProcessNodeStatus.COMPLETED]: 'status-completed',
            [ProcessNodeStatus.FAILED]: 'status-failed',
            [ProcessNodeStatus.SKIPPED]: 'status-skipped',
        };
        return classes[status] || '';
    }
    /**
     * 获取形状CSS类
     */
    getShapeClass(type) {
        const classes = {
            [ProcessNodeType.CUSTOM_FORM]: 'shape-circle',
            [ProcessNodeType.MAIN_FORM]: 'shape-square',
            [ProcessNodeType.APPROVAL]: 'shape-diamond',
            [ProcessNodeType.LOGIC_GATE]: 'shape-diamond',
        };
        return classes[type] || '';
    }
    /**
     * 获取节点图标
     */
    getNodeIcon(type) {
        const icons = {
            [ProcessNodeType.CUSTOM_FORM]: '📝',
            [ProcessNodeType.MAIN_FORM]: '📋',
            [ProcessNodeType.APPROVAL]: '✓',
            [ProcessNodeType.LOGIC_GATE]: '◇',
        };
        return icons[type] || '●';
    }
    canRollback() {
        const currentNode = this.getCurrentNode();
        if (!currentNode)
            return false;
        return currentNode.rollbackable;
    }
    // ==================== 公开方法 ====================
    /**
     * 跳转到指定节点
     */
    navigateTo(nodeId) {
        this.state.currentNodeId = nodeId;
        this.state.isDirty = true;
    }
    /**
     * 保存数据
     */
    save() {
        if (this.onSave) {
            const currentNode = this.getCurrentNode();
            this.onSave(currentNode?.data || {});
        }
        this.state.isDirty = false;
    }
    /**
     * 提交数据
     */
    submit() {
        // 验证字段合理性
        if (!this.validateFields()) {
            console.warn('请填写必填字段');
            return false;
        }
        if (this.onSubmit) {
            const currentNode = this.getCurrentNode();
            this.onSubmit(currentNode?.data || {});
        }
        // 跳转到下一个节点
        this.moveToNextNode();
        return true;
    }
    /**
     * 验证字段
     */
    validateFields() {
        // 实际实现中，这里会调用表单验证逻辑
        return true;
    }
    /**
     * 移动到下一个节点
     */
    moveToNextNode() {
        const currentIndex = this.state.processDefinition.nodes.findIndex(n => n.id === this.state.currentNodeId);
        if (currentIndex < this.state.processDefinition.nodes.length - 1) {
            this.state.currentNodeId = this.state.processDefinition.nodes[currentIndex + 1].id;
        }
    }
    /**
     * 回退到上一个节点
     */
    rollback() {
        if (!this.canRollback()) {
            console.warn('当前节点不可回退');
            return;
        }
        if (this.onRollback) {
            this.onRollback(this.state.currentNodeId);
        }
        // 找到上一个可回退的节点
        const currentIndex = this.state.processDefinition.nodes.findIndex(n => n.id === this.state.currentNodeId);
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (this.state.processDefinition.nodes[i].rollbackable) {
                this.state.currentNodeId = this.state.processDefinition.nodes[i].id;
                this.state.isDirty = true;
                return;
            }
        }
    }
    /**
     * Override操作
     */
    override(reason) {
        if (this.onOverride) {
            this.onOverride(reason);
        }
    }
    /**
     * 添加评论
     */
    addComment(content, nodeId) {
        const comment = {
            id: `comment-${Date.now()}`,
            userId: 'current-user',
            userName: '当前用户',
            content,
            timestamp: new Date(),
            nodeId,
        };
        this.state.comments.push(comment);
    }
    /**
     * 获取组件状态
     */
    getState() {
        return { ...this.state };
    }
}
exports.SOSPAComponent = SOSPAComponent;
// ==================== 样式定义 ====================
exports.SOSPAStyles = `
<style>
.so-spa {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  max-width: 1200px;
  margin: 0 auto;
}

/* 顶部状态栏 */
.so-spa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.so-id {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.so-status {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.status-draft { background: #e3f2fd; color: #1976d2; }
.status-pending_approval { background: #fff3e0; color: #f57c00; }
.status-approved { background: #e8f5e9; color: #388e3c; }
.status-rejected { background: #ffebee; color: #d32f2f; }
.status-processing { background: #e3f2fd; color: #1976d2; }
.status-completed { background: #e8f5e9; color: #388e3c; }

/* Toggle Switch */
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.toggle-switch input {
  display: none;
}

.toggle-slider {
  width: 44px;
  height: 24px;
  background: #ccc;
  border-radius: 12px;
  position: relative;
  transition: background 0.3s;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
}

.toggle-switch input:checked + .toggle-slider {
  background: #4caf50;
}

.toggle-switch input:checked + .toggle-slider::after {
  transform: translateX(20px);
}

.toggle-label {
  font-size: 14px;
  color: #666;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 进度条 */
.so-spa-progress {
  padding: 24px;
  background: #fafafa;
  border-bottom: 1px solid #e0e0e0;
}

.progress-track {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  position: relative;
  padding: 20px 0;
  overflow-x: auto;
}

/* 进度节点 */
.progress-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 80px;
}

.progress-node .node-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.3s;
}

.progress-node .node-label {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  text-align: center;
}

/* 节点形状 */
.shape-circle .node-icon {
  border-radius: 50%;
  border: 2px solid #ddd;
  background: #fff;
}

.shape-square .node-icon {
  border-radius: 4px;
  border: 2px solid #ddd;
  background: #fff;
}

.shape-diamond .node-icon {
  transform: rotate(45deg);
  border: 2px solid #ddd;
  background: #fff;
  width: 32px;
  height: 32px;
}

/* 节点状态 */
.status-pending .node-icon {
  border-color: #ccc !important;
  color: #999;
  background: #f5f5f5 !important;
}

.status-in-progress .node-icon {
  border-color: #ff9800 !important;
  color: #ff9800;
  background: #fff3e0 !important;
  animation: pulse 2s infinite;
}

.status-completed .node-icon {
  border-color: #4caf50 !important;
  color: #fff;
  background: #4caf50 !important;
}

.status-failed .node-icon {
  border-color: #f44336 !important;
  color: #fff;
  background: #f44336 !important;
}

.status-in-progress.current .node-icon {
  transform: scale(1.1);
}

/* 连接线 */
.progress-connection {
  width: 40px;
  height: 2px;
  background: #ddd;
  margin: 0 -2px;
  position: relative;
  top: -20px;
}

.status-completed + .progress-connection,
.progress-connection:has(+ .status-completed) {
  background: #4caf50;
}

.progress-connection:has(+ .status-in-progress) {
  background: linear-gradient(to right, #4caf50, #ff9800);
}

/* 回退按钮 */
.rollback-section {
  margin-top: 16px;
  display: flex;
  justify-content: flex-start;
}

.btn-rollback {
  background: #f5f5f5;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-rollback:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-rollback:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 主表单区域 */
.so-spa-content {
  padding: 24px;
  min-height: 400px;
}

.main-form-container {
  max-width: 800px;
  margin: 0 auto;
}

.form-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.form-header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #333;
}

.approver-info {
  font-size: 14px;
  color: #666;
}

.approval-comment {
  margin-top: 8px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
}

/* 底部操作栏 */
.so-spa-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.last-updated {
  font-size: 12px;
  color: #999;
}

.dirty-indicator {
  font-size: 12px;
  color: #ff9800;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 24px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-save {
  background: #f5f5f5;
  border: 1px solid #ddd;
  color: #333;
}

.btn-save:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-submit {
  background: #1976d2;
  color: #fff;
}

.btn-submit:hover:not(:disabled) {
  background: #1565c0;
}

.btn-override {
  background: #fff;
  border: 1px solid #ff9800;
  color: #ff9800;
}

.btn-comment {
  background: #fff;
  border: 1px solid #ddd;
  position: relative;
}

.comment-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #f44336;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

/* 模态框 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 24px;
}

.modal-body textarea {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel {
  background: #f5f5f5;
  color: #333;
}

.btn-confirm {
  background: #ff9800;
  color: #fff;
}

/* 面板 */
.panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 400px;
  background: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 999;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.panel-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.panel-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

.panel-footer input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* 动画 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 152, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0);
  }
}
</style>
`;
//# sourceMappingURL=so-spa.component.js.map