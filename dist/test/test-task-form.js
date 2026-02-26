"use strict";
// =====================================================
// 测试通过 Task 获取表单信息
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
const camunda8_client_1 = require("../orchestration/camunda8-client");
async function testTaskForm() {
    const client = new camunda8_client_1.Camunda8TasklistClient('http://localhost:8088/tasklist');
    console.log('=== Testing Task Form Info ===\n');
    // 使用一个真实的任务 ID 测试
    const taskId = '2251799813740319';
    try {
        console.log(`Getting task details for: ${taskId}`);
        const task = await client.getTaskDetails(taskId);
        console.log('\nTask Details:');
        console.log('  - ID:', task.id);
        console.log('  - Name:', task.name);
        console.log('  - Form Key:', task.formKey);
        console.log('  - Process Definition Key:', task.processDefinitionKey);
        console.log('  - Process Instance Key:', task.processInstanceKey);
        // 如果任务有 formKey，尝试获取表单
        if (task.formKey) {
            console.log(`\nTrying to get form: ${task.formKey}`);
            const form = await client.getForm(task.formKey, task.processDefinitionKey);
            if (form) {
                console.log('✅ Form found!');
                console.log('  - Title:', form.title);
                console.log('  - Schema length:', form.schema?.length);
            }
            else {
                console.log('❌ Form not found via API');
                console.log('   Note: Embedded forms (referenced by formId in BPMN) are not accessible via /v1/forms API');
                console.log('   The form schema must be loaded from local .form files or Camunda Modeler deployment');
            }
        }
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
}
testTaskForm().then(() => {
    console.log('\n=== Test completed ===');
    process.exit(0);
}).catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
});
//# sourceMappingURL=test-task-form.js.map