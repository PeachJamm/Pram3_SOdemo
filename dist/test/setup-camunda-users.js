"use strict";
// =====================================================
// PRAMunda 8 用户配置检查与设置
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 检查 Camunda 8 身份验证配置
 */
async function checkCamundaAuth() {
    console.log('检查 Camunda 8 身份验证配置...\n');
    const endpoints = [
        { name: 'Camunda REST API', url: 'http://localhost:8080' },
        { name: 'Tasklist', url: 'http://localhost:8081' },
        { name: 'Operate', url: 'http://localhost:8082' },
        { name: 'Zeebe Gateway', url: 'http://localhost:26500' },
    ];
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint.url, { method: 'GET' });
            console.log(`✅ ${endpoint.name}: ${endpoint.url} - ${response.status}`);
        }
        catch (error) {
            console.log(`❌ ${endpoint.name}: ${endpoint.url} - 无法连接`);
        }
    }
}
/**
 * 演示账号列表
 */
const demoUsers = [
    { username: 'sales01', password: 'sales01', role: 'SALES', permissions: ['ORDER_CREATE'] },
    { username: 'admin01', password: 'admin01', role: 'ADMIN', permissions: ['ORDER_OVERRIDE', 'ALL'] },
    { username: 'salesmgr01', password: 'salesmgr01', role: 'SALES_MANAGER', permissions: ['APPROVE_SMALL'] },
    { username: 'finance01', password: 'finance01', role: 'FINANCE', permissions: ['APPROVE_MEDIUM'] },
    { username: 'director01', password: 'director01', role: 'DIRECTOR', permissions: ['APPROVE_LARGE'] },
];
/**
 * 打印账号信息
 */
function printUserGuide() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║              Camunda 8 演示账号配置指南                       ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║                                                              ║');
    console.log('║  在 Camunda 8 c8run 中，演示账号通常通过以下方式配置：          ║');
    console.log('║                                                              ║');
    console.log('║  1. 默认演示模式 (无身份验证):                                ║');
    console.log('║     - 访问 http://localhost:8080 无需登录                      ║');
    console.log('║     - Tasklist/Operate 可能直接访问或需要简单登录               ║');
    console.log('║                                                              ║');
    console.log('║  2. 使用 application.yaml 配置账号:                          ║');
    console.log('║     文件位置: c8run-8.8.9/config/application.yaml            ║');
    console.log('║                                                              ║');
    console.log('║  3. 通过 Camunda Identity (企业版):                          ║');
    console.log('║     - 需要单独启动 Identity 服务                              ║');
    console.log('║     - 访问 http://localhost:8084 管理用户                     ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('预期演示账号列表:');
    console.log('─────────────────────────────────────────────────────────────');
    demoUsers.forEach(user => {
        console.log(`  👤 ${user.username.padEnd(12)} | ${user.role.padEnd(15)} | ${user.permissions.join(', ')}`);
    });
    console.log('─────────────────────────────────────────────────────────────\n');
    console.log('解决方案:');
    console.log('  1. 检查 c8run 是否以演示模式启动');
    console.log('     命令: .\c8run.exe start --demo');
    console.log('');
    console.log('  2. 检查配置文件');
    console.log('     文件: E:\gloriaCode\camunda8-getting-started\c8run-8.8.9\config\application.yaml');
    console.log('');
    console.log('  3. 如果使用简单身份验证，尝试以下默认账号:');
    console.log('     - demo / demo');
    console.log('     - admin / admin');
    console.log('     - 或检查 c8run 启动日志中的默认账号信息');
    console.log('');
}
// 运行检查
checkCamundaAuth().then(() => {
    printUserGuide();
}).catch(error => {
    console.error('检查失败:', error);
});
//# sourceMappingURL=setup-camunda-users.js.map