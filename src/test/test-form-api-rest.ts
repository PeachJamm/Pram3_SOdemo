// =====================================================
// 直接测试 Camunda 8 Tasklist /v1/forms REST API
// =====================================================

async function testFormApi() {
  console.log('=== Testing Camunda 8 Tasklist REST API ===\n');

  const formId = 'order-validation';
  const processDefinitionKey = 'sales-order-process';
  
  // 测试不同端口和路径
  const endpoints = [
    `http://localhost:8088/v1/forms/${formId}?processDefinitionKey=${processDefinitionKey}`,
    `http://localhost:8088/tasklist/v1/forms/${formId}?processDefinitionKey=${processDefinitionKey}`,
    `http://localhost:8080/v1/forms/${formId}?processDefinitionKey=${processDefinitionKey}`,
    `http://localhost:8080/tasklist/v1/forms/${formId}?processDefinitionKey=${processDefinitionKey}`,
  ];

  for (const url of endpoints) {
    console.log(`\nTesting: ${url}`);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data: any = await response.json();
        console.log('  ✅ Success!');
        console.log('  Form Title:', data.title);
        console.log('  Schema preview:', data.schema?.substring(0, 200));
        return;
      } else {
        const text = await response.text();
        console.log('  Response:', text.substring(0, 200));
      }
    } catch (error: any) {
      console.log('  ❌ Error:', error.message);
    }
  }

  console.log('\n=== All endpoints failed ===');
  console.log('\nPossible reasons:');
  console.log('1. Camunda Tasklist is not running on ports 8080/8088');
  console.log('2. The form is embedded in BPMN (not deployed separately)');
  console.log('3. Form API is disabled in Camunda configuration');
  console.log('4. Authentication is required');
}

testFormApi().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
