"use strict";
async;
getProcessFlowStatus(taskInfo, TaskInfo);
Promise < {
    processInstanceKey: string,
    processStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELED',
    currentStepId: string,
    bpmnXml: string,
    steps: ProcessStep[]
} > {
    const: processInstanceKey = taskInfo.processInstanceKey,
    const: processDefinitionKey = taskInfo.processDefinitionKey || '2251799813689190',
    const: currentElementId = taskInfo.variables?.taskDefinitionId ||
        taskInfo.variables?.elementId ||
        'task-order-validation',
    // 1. 查询 Camunda 流程实例状态
    let, processStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELED', 'ACTIVE': ,
    try: {
        const: response = await fetch(`http://localhost:8088/v2/process-instances/${processInstanceKey}`),
        if(response) { }, : .ok
    }
};
{
    const data = await response.json();
    processStatus = data.state || 'ACTIVE';
}
try { }
catch (e) {
    console.warn('[FormController] Failed to get process status:', e);
}
// 2. 从 Camunda 获取 BPMN XML
let bpmnXml = '';
try {
    const response = await fetch(`http://localhost:8088/v2/process-definitions/${processDefinitionKey}/xml`);
    if (response.ok) {
        const data = await response.json();
        bpmnXml = data.xml || '';
        console.log(`[FormController] BPMN XML loaded: ${bpmnXml.length} chars`);
    }
}
catch (e) {
    console.warn('[FormController] Failed to get BPMN XML:', e);
}
// 3. 从 Camunda 获取实时流程状态
const steps = await this.getFlowNodeStatusFromCamunda(processInstanceKey, currentElementId, taskInfo);
return {
    processInstanceKey,
    processStatus,
    currentStepId: currentElementId,
    bpmnXml,
    steps,
};
async;
getFlowNodeStatusFromCamunda(processInstanceKey, string, currentElementId, string, taskInfo, TaskInfo);
Promise < ProcessStep[] > {
    const: steps, ProcessStep, []:  = [],
    try: {
        // 查询 Camunda 的 flow node instances
        const: response = await fetch(`http://localhost:8088/v2/flow-node-instances`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filter: { processInstanceKey }
            }),
        }),
        if(response) { }, : .ok
    }
};
{
    const data = await response.json();
    const flowNodes = data.items || [];
    // 将 flow node instances 转换为步骤
    for (const node of flowNodes) {
        const step = {
            id: node.flowNodeId,
            name: node.flowNodeName || node.flowNodeId,
            status: this.mapCamundaStateToStatus(node.state, node.flowNodeId, currentElementId),
        };
        // 如果是当前活动节点，添加 assignee
        if (node.state === 'ACTIVE' && node.flowNodeId === currentElementId) {
            step.assignee = taskInfo.assignee || undefined;
        }
        // 如果是已完成节点，添加完成时间
        if (node.state === 'COMPLETED' && node.endDate) {
            step.completedAt = node.endDate;
        }
        steps.push(step);
    }
    console.log(`[FormController] Loaded ${steps.length} flow nodes from Camunda`);
}
try { }
catch (e) {
    console.warn('[FormController] Failed to get flow nodes from Camunda:', e);
}
return steps;
mapCamundaStateToStatus(camundaState, string, nodeId, string, currentElementId, string);
'COMPLETED' | 'CURRENT' | 'PENDING';
{
    switch (camundaState) {
        case 'COMPLETED':
            return 'COMPLETED';
        case 'ACTIVE':
        case 'ACTIVATED':
            return 'CURRENT';
        case 'TERMINATED':
        case 'CANCELED':
            return 'PENDING';
        default:
            return nodeId === currentElementId ? 'CURRENT' : 'PENDING';
    }
}
//# sourceMappingURL=form-controller-new-methods.js.map