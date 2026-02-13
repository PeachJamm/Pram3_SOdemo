import { SalesOrder, ApprovalHistory } from '../../domains/sales/models/sales-order.types';
/**
 * 流程节点类型
 */
export declare enum ProcessNodeType {
    CUSTOM_FORM = "CUSTOM_FORM",// 圆形 - 自定义表单
    MAIN_FORM = "MAIN_FORM",// 方形 - 主表单
    APPROVAL = "APPROVAL",// 菱形 - 审批节点
    LOGIC_GATE = "LOGIC_GATE"
}
/**
 * 流程节点状态
 */
export declare enum ProcessNodeStatus {
    PENDING = "PENDING",// 灰色 - 待执行
    IN_PROGRESS = "IN_PROGRESS",// 橙色 - 进行中
    COMPLETED = "COMPLETED",// 绿色 - 已完成
    FAILED = "FAILED",// 红色 - 失败
    SKIPPED = "SKIPPED"
}
/**
 * 流程节点
 */
export interface ProcessNode {
    id: string;
    type: ProcessNodeType;
    label: string;
    status: ProcessNodeStatus;
    formKey?: string;
    data?: Record<string, unknown>;
    completedAt?: Date;
    approver?: string;
    comment?: string;
    rollbackable: boolean;
}
/**
 * 流程连线
 */
export interface ProcessConnection {
    id: string;
    fromNodeId: string;
    toNodeId: string;
    condition?: string;
}
/**
 * 流程定义
 */
export interface ProcessDefinition {
    nodes: ProcessNode[];
    connections: ProcessConnection[];
}
/**
 * SO SPA 状态
 */
export interface SOSPAState {
    salesOrder: SalesOrder | null;
    currentNodeId: string;
    isActive: boolean;
    processDefinition: ProcessDefinition;
    approvalHistory: ApprovalHistory[];
    comments: Comment[];
    isDirty: boolean;
}
/**
 * 审批评论
 */
export interface Comment {
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: Date;
    nodeId?: string;
}
/**
 * SO SPA 组件
 */
export declare class SOSPAComponent {
    private state;
    private onSave?;
    private onSubmit?;
    private onRollback?;
    private onOverride?;
    constructor(salesOrder: SalesOrder, callbacks?: {
        onSave?: (data: Record<string, unknown>) => void;
        onSubmit?: (data: Record<string, unknown>) => void;
        onRollback?: (nodeId: string) => void;
        onOverride?: (reason: string) => void;
    });
    /**
     * 构建流程定义
     */
    private buildProcessDefinition;
    /**
     * 获取最新流程节点ID
     */
    private getLatestProcessNode;
    /**
     * 获取节点状态
     */
    private getStatusForNode;
    /**
     * 获取审批状态
     */
    private getApprovalStatus;
    /**
     * 获取审批人
     */
    private getApprover;
    /**
     * 获取审批意见
     */
    private getApprovalComment;
    /**
     * 获取自动处理状态
     */
    private getAutoProcessStatus;
    /**
     * 获取当前节点
     */
    getCurrentNode(): ProcessNode | null;
    /**
     * 渲染SPA HTML
     */
    render(): string;
    /**
     * 渲染进度节点
     */
    private renderProgressNodes;
    /**
     * 渲染连线
     */
    private renderConnections;
    /**
     * 渲染主表单
     */
    private renderMainForm;
    /**
     * 渲染评论列表
     */
    private renderComments;
    /**
     * 获取状态标签
     */
    private getStatusLabel;
    /**
     * 获取状态CSS类
     */
    private getStatusClass;
    /**
     * 获取形状CSS类
     */
    private getShapeClass;
    /**
     * 获取节点图标
     */
    private getNodeIcon;
    private canRollback;
    /**
     * 跳转到指定节点
     */
    navigateTo(nodeId: string): void;
    /**
     * 保存数据
     */
    save(): void;
    /**
     * 提交数据
     */
    submit(): boolean;
    /**
     * 验证字段
     */
    private validateFields;
    /**
     * 移动到下一个节点
     */
    private moveToNextNode;
    /**
     * 回退到上一个节点
     */
    rollback(): void;
    /**
     * Override操作
     */
    override(reason: string): void;
    /**
     * 添加评论
     */
    addComment(content: string, nodeId?: string): void;
    /**
     * 获取组件状态
     */
    getState(): SOSPAState;
}
export declare const SOSPAStyles = "\n<style>\n.so-spa {\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n  border: 1px solid #e0e0e0;\n  border-radius: 8px;\n  background: #fff;\n  max-width: 1200px;\n  margin: 0 auto;\n}\n\n/* \u9876\u90E8\u72B6\u6001\u680F */\n.so-spa-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 16px 24px;\n  border-bottom: 1px solid #e0e0e0;\n  background: #f8f9fa;\n  border-radius: 8px 8px 0 0;\n}\n\n.header-left {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n}\n\n.so-id {\n  font-size: 18px;\n  font-weight: 600;\n  color: #333;\n}\n\n.so-status {\n  padding: 4px 12px;\n  border-radius: 4px;\n  font-size: 14px;\n  font-weight: 500;\n}\n\n.status-draft { background: #e3f2fd; color: #1976d2; }\n.status-pending_approval { background: #fff3e0; color: #f57c00; }\n.status-approved { background: #e8f5e9; color: #388e3c; }\n.status-rejected { background: #ffebee; color: #d32f2f; }\n.status-processing { background: #e3f2fd; color: #1976d2; }\n.status-completed { background: #e8f5e9; color: #388e3c; }\n\n/* Toggle Switch */\n.toggle-switch {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  cursor: pointer;\n}\n\n.toggle-switch input {\n  display: none;\n}\n\n.toggle-slider {\n  width: 44px;\n  height: 24px;\n  background: #ccc;\n  border-radius: 12px;\n  position: relative;\n  transition: background 0.3s;\n}\n\n.toggle-slider::after {\n  content: '';\n  position: absolute;\n  width: 20px;\n  height: 20px;\n  background: #fff;\n  border-radius: 50%;\n  top: 2px;\n  left: 2px;\n  transition: transform 0.3s;\n}\n\n.toggle-switch input:checked + .toggle-slider {\n  background: #4caf50;\n}\n\n.toggle-switch input:checked + .toggle-slider::after {\n  transform: translateX(20px);\n}\n\n.toggle-label {\n  font-size: 14px;\n  color: #666;\n}\n\n.header-actions {\n  display: flex;\n  gap: 12px;\n}\n\n/* \u8FDB\u5EA6\u6761 */\n.so-spa-progress {\n  padding: 24px;\n  background: #fafafa;\n  border-bottom: 1px solid #e0e0e0;\n}\n\n.progress-track {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 0;\n  position: relative;\n  padding: 20px 0;\n  overflow-x: auto;\n}\n\n/* \u8FDB\u5EA6\u8282\u70B9 */\n.progress-node {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  cursor: pointer;\n  transition: all 0.3s;\n  min-width: 80px;\n}\n\n.progress-node .node-icon {\n  width: 40px;\n  height: 40px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 18px;\n  transition: all 0.3s;\n}\n\n.progress-node .node-label {\n  margin-top: 8px;\n  font-size: 12px;\n  color: #666;\n  text-align: center;\n}\n\n/* \u8282\u70B9\u5F62\u72B6 */\n.shape-circle .node-icon {\n  border-radius: 50%;\n  border: 2px solid #ddd;\n  background: #fff;\n}\n\n.shape-square .node-icon {\n  border-radius: 4px;\n  border: 2px solid #ddd;\n  background: #fff;\n}\n\n.shape-diamond .node-icon {\n  transform: rotate(45deg);\n  border: 2px solid #ddd;\n  background: #fff;\n  width: 32px;\n  height: 32px;\n}\n\n/* \u8282\u70B9\u72B6\u6001 */\n.status-pending .node-icon {\n  border-color: #ccc !important;\n  color: #999;\n  background: #f5f5f5 !important;\n}\n\n.status-in-progress .node-icon {\n  border-color: #ff9800 !important;\n  color: #ff9800;\n  background: #fff3e0 !important;\n  animation: pulse 2s infinite;\n}\n\n.status-completed .node-icon {\n  border-color: #4caf50 !important;\n  color: #fff;\n  background: #4caf50 !important;\n}\n\n.status-failed .node-icon {\n  border-color: #f44336 !important;\n  color: #fff;\n  background: #f44336 !important;\n}\n\n.status-in-progress.current .node-icon {\n  transform: scale(1.1);\n}\n\n/* \u8FDE\u63A5\u7EBF */\n.progress-connection {\n  width: 40px;\n  height: 2px;\n  background: #ddd;\n  margin: 0 -2px;\n  position: relative;\n  top: -20px;\n}\n\n.status-completed + .progress-connection,\n.progress-connection:has(+ .status-completed) {\n  background: #4caf50;\n}\n\n.progress-connection:has(+ .status-in-progress) {\n  background: linear-gradient(to right, #4caf50, #ff9800);\n}\n\n/* \u56DE\u9000\u6309\u94AE */\n.rollback-section {\n  margin-top: 16px;\n  display: flex;\n  justify-content: flex-start;\n}\n\n.btn-rollback {\n  background: #f5f5f5;\n  border: 1px solid #ddd;\n  padding: 8px 16px;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 14px;\n}\n\n.btn-rollback:hover:not(:disabled) {\n  background: #e0e0e0;\n}\n\n.btn-rollback:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n\n/* \u4E3B\u8868\u5355\u533A\u57DF */\n.so-spa-content {\n  padding: 24px;\n  min-height: 400px;\n}\n\n.main-form-container {\n  max-width: 800px;\n  margin: 0 auto;\n}\n\n.form-header {\n  margin-bottom: 24px;\n  padding-bottom: 16px;\n  border-bottom: 1px solid #e0e0e0;\n}\n\n.form-header h2 {\n  margin: 0 0 8px 0;\n  font-size: 20px;\n  color: #333;\n}\n\n.approver-info {\n  font-size: 14px;\n  color: #666;\n}\n\n.approval-comment {\n  margin-top: 8px;\n  padding: 12px;\n  background: #f5f5f5;\n  border-radius: 4px;\n  font-size: 14px;\n  color: #666;\n}\n\n/* \u5E95\u90E8\u64CD\u4F5C\u680F */\n.so-spa-footer {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 16px 24px;\n  border-top: 1px solid #e0e0e0;\n  background: #f8f9fa;\n  border-radius: 0 0 8px 8px;\n}\n\n.footer-left {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n}\n\n.last-updated {\n  font-size: 12px;\n  color: #999;\n}\n\n.dirty-indicator {\n  font-size: 12px;\n  color: #ff9800;\n}\n\n.footer-actions {\n  display: flex;\n  gap: 12px;\n}\n\n.btn {\n  padding: 10px 24px;\n  border-radius: 4px;\n  font-size: 14px;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.3s;\n  border: none;\n}\n\n.btn:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n\n.btn-save {\n  background: #f5f5f5;\n  border: 1px solid #ddd;\n  color: #333;\n}\n\n.btn-save:hover:not(:disabled) {\n  background: #e0e0e0;\n}\n\n.btn-submit {\n  background: #1976d2;\n  color: #fff;\n}\n\n.btn-submit:hover:not(:disabled) {\n  background: #1565c0;\n}\n\n.btn-override {\n  background: #fff;\n  border: 1px solid #ff9800;\n  color: #ff9800;\n}\n\n.btn-comment {\n  background: #fff;\n  border: 1px solid #ddd;\n  position: relative;\n}\n\n.comment-badge {\n  position: absolute;\n  top: -6px;\n  right: -6px;\n  background: #f44336;\n  color: #fff;\n  font-size: 10px;\n  padding: 2px 6px;\n  border-radius: 10px;\n}\n\n/* \u6A21\u6001\u6846 */\n.modal {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background: rgba(0, 0, 0, 0.5);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 1000;\n}\n\n.modal-content {\n  background: #fff;\n  border-radius: 8px;\n  width: 500px;\n  max-width: 90%;\n}\n\n.modal-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 16px 24px;\n  border-bottom: 1px solid #e0e0e0;\n}\n\n.modal-close {\n  background: none;\n  border: none;\n  font-size: 24px;\n  cursor: pointer;\n}\n\n.modal-body {\n  padding: 24px;\n}\n\n.modal-body textarea {\n  width: 100%;\n  border: 1px solid #ddd;\n  border-radius: 4px;\n  padding: 12px;\n  resize: vertical;\n}\n\n.modal-footer {\n  display: flex;\n  justify-content: flex-end;\n  gap: 12px;\n  padding: 16px 24px;\n  border-top: 1px solid #e0e0e0;\n}\n\n.btn-cancel {\n  background: #f5f5f5;\n  color: #333;\n}\n\n.btn-confirm {\n  background: #ff9800;\n  color: #fff;\n}\n\n/* \u9762\u677F */\n.panel {\n  position: fixed;\n  right: 0;\n  top: 0;\n  bottom: 0;\n  width: 400px;\n  background: #fff;\n  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);\n  z-index: 999;\n  display: flex;\n  flex-direction: column;\n}\n\n.panel-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 16px 24px;\n  border-bottom: 1px solid #e0e0e0;\n}\n\n.panel-close {\n  background: none;\n  border: none;\n  font-size: 24px;\n  cursor: pointer;\n}\n\n.panel-body {\n  flex: 1;\n  overflow-y: auto;\n  padding: 24px;\n}\n\n.panel-footer {\n  display: flex;\n  gap: 12px;\n  padding: 16px 24px;\n  border-top: 1px solid #e0e0e0;\n}\n\n.panel-footer input {\n  flex: 1;\n  padding: 10px;\n  border: 1px solid #ddd;\n  border-radius: 4px;\n}\n\n/* \u52A8\u753B */\n@keyframes pulse {\n  0% {\n    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4);\n  }\n  70% {\n    box-shadow: 0 0 0 10px rgba(255, 152, 0, 0);\n  }\n  100% {\n    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0);\n  }\n}\n</style>\n";
//# sourceMappingURL=so-spa.component.d.ts.map