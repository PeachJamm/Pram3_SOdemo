// =====================================================
// 使用正确的 processDefinitionKey 测试表单 API
// =====================================================

async function testFormWithCorrectKey() {
  console.log('=== Testing /v1/forms with correct processDefinitionKey ===\n');
  
  const formId = 'order-validation';
  
  // 从部署输出获取的实际 key
  const processDefinitionKey = '2251799813689190';  // 数字 key，不是 "sales-order-process"
  
  const url = `http://localhost:8088/v1/forms/${formId}?processDefinitionKey=${processDefinitionKey}`;
  
  console.log(`Form ID: ${formId}`);
  console.log(`Process Definition Key: ${processDefinitionKey}`);
  console.log(`URL: ${url}\n`);
  
  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data: any = await response.json();
      console.log('\n✅ SUCCESS! Form found:');
      console.log('  - ID:', data.id);
      console.log('  - Title:', data.title);
      console.log('  - Process Definition Key:', data.processDefinitionKey);
      console.log('  - Version:', data.version);
      console.log('  - Schema length:', data.schema?.length);
      console.log('\nSchema preview (first 500 chars):');
      console.log(data.schema?.substring(0, 500) + '...');
    } else {
      const text = await response.text();
      console.log('\n❌ Error:', text);
    }
  } catch (error: any) {
    console.log('\n❌ Exception:', error.message);
  }
}

testFormWithCorrectKey().then(() => {
  console.log('\n=== Test completed ===');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
