"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 测试渲染 API 返回的流程导航
const connection_1 = require("../database/connection");
async function test() {
    const db = new connection_1.DatabaseConnection({
        type: 'sqlite',
        sqlite: { filename: './pram3.db' },
    });
    await db.connect();
    // 查询审批历史
    const orderId = 'order-1771640932611';
    const history = await db.query(`SELECT ah.id, ah.action, ah.comment, ah.created_at, 
            u.username, u.full_name, u.role
     FROM approval_history ah
     JOIN users u ON ah.approver_id = u.id
     WHERE ah.sales_order_id = ?
     ORDER BY ah.created_at ASC`, [orderId]);
    console.log('Approval History:', history);
    await db.close();
}
test().catch(console.error);
//# sourceMappingURL=test-render-with-flow.js.map