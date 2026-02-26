"use strict";
// =====================================================
// 测试 Camunda 8 Tasklist getForm API
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
const camunda8_client_1 = require("../orchestration/camunda8-client");
async function testGetForm() {
    const client = new camunda8_client_1.Camunda8TasklistClient('http://localhost:8088/tasklist');
    console.log('=== Testing Camunda 8 Tasklist getForm API ===\n');
    // 测试参数
    const formId = 'order-validation'; // 表单ID (对应 formKey)
    const processDefinitionKey = 'sales-order-process'; // 流程定义Key
    console.log(`Form ID: ${formId}`);
    console.log(`Process Definition Key: ${processDefinitionKey}\n`);
    try {
        const form = await client.getForm(formId, processDefinitionKey);
        if (form) {
            console.log('✅ Form loaded successfully!');
            console.log('\nForm Details:');
            console.log('  - ID:', form.id);
            console.log('  - Title:', form.title);
            console.log('  - Process Definition Key:', form.processDefinitionKey);
            console.log('  - Version:', form.version);
            console.log('  - Tenant ID:', form.tenantId);
            console.log('  - Is Deleted:', form.isDeleted);
            console.log('\nForm Schema (first 500 chars):');
            console.log(form.schema?.substring(0, 500) + '...');
        }
        else {
            console.log('❌ Form not found or API unavailable');
        }
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
}
// 运行测试
testGetForm().then(() => {
    console.log('\n=== Test completed ===');
    process.exit(0);
}).catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
});
//# sourceMappingURL=test-get-form.js.map