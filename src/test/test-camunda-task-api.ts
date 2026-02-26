// =====================================================
// Test Camunda Task API
// 测试从 Camunda 获取任务接口
// =====================================================

import { Camunda8TasklistClient } from '../orchestration/camunda8-client';

async function testCamundaTaskAPI() {
  console.log('========================================');
  console.log('Testing Camunda Tasklist API');
  console.log('========================================\n');

  const client = new Camunda8TasklistClient('http://localhost:8088/tasklist');

  // 测试用的 processInstanceKey（从之前的日志中获取）
  const processInstanceKey = '2251799813731999';

  console.log('1. Testing getTaskByProcessInstance...');
  console.log(`   ProcessInstanceKey: ${processInstanceKey}\n`);

  try {
    const tasks = await client.getTaskByProcessInstance(processInstanceKey);
    console.log('✅ SUCCESS! Tasks found:', tasks.length);
    console.log('\nTask details:');
    console.log(JSON.stringify(tasks, null, 2));
  } catch (error) {
    console.error('❌ FAILED:', error);
  }

  console.log('\n========================================');
  console.log('Test completed');
  console.log('========================================');
}

// 运行测试
testCamundaTaskAPI().catch(console.error);
