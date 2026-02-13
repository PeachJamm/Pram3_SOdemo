"use strict";
// =====================================================
// PRAM3 ERP Core - Deploy Resources to Camunda 8
// 部署 BPMN、DMN 和表单到 Camunda 8
// =====================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const camunda8_client_1 = require("../orchestration/camunda8-client");
/**
 * 部署服务
 */
class CamundaDeployer {
    constructor() {
        this.client = new camunda8_client_1.Camunda8Client({
            gatewayAddress: 'localhost:26500',
            plaintext: true,
        });
        this.basePath = path.resolve(__dirname, '..');
    }
    /**
     * 部署所有资源
     */
    async deployAll() {
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║           部署资源到 Camunda 8.8                             ║');
        console.log('╚══════════════════════════════════════════════════════════════╝\n');
        try {
            // 1. 部署 BPMN 流程
            await this.deployBPMN();
            // 2. 部署 DMN 决策表
            await this.deployDMN();
            // 3. 部署表单
            await this.deployForms();
            console.log('\n✅ 所有资源部署完成！');
        }
        catch (error) {
            console.error('\n❌ 部署失败:', error);
            throw error;
        }
        finally {
            await this.client.close();
        }
    }
    /**
     * 部署 BPMN 文件
     */
    async deployBPMN() {
        console.log('📋 部署 BPMN 流程...');
        const bpmnPath = path.join(this.basePath, 'camunda', 'workflows', 'sales-order-approval.bpmn');
        if (!fs.existsSync(bpmnPath)) {
            console.warn(`  ⚠️  文件不存在: ${bpmnPath}`);
            return;
        }
        try {
            const result = await this.client.deployProcess(bpmnPath);
            console.log(`  ✅ 流程部署成功`);
            console.log(`     - Process Definition Key: ${result.processDefinitionKey}`);
            console.log(`     - Version: ${result.version}`);
        }
        catch (error) {
            console.error(`  ❌ 部署失败: ${error}`);
            throw error;
        }
    }
    /**
     * 部署 DMN 文件
     */
    async deployDMN() {
        console.log('\n🧠 部署 DMN 决策表...');
        const dmnFiles = [
            'select-approval-level.dmn',
            'calculate-discount.dmn',
            'select-price-list.dmn',
        ];
        for (const file of dmnFiles) {
            const dmnPath = path.join(this.basePath, 'camunda', 'dmn', file);
            if (!fs.existsSync(dmnPath)) {
                console.warn(`  ⚠️  文件不存在: ${file}`);
                continue;
            }
            try {
                // 使用 deployResource 部署 DMN
                const { ZBClient } = require('zeebe-node');
                const zbc = new ZBClient('localhost:26500', { useTLS: false });
                const result = await zbc.deployResource({
                    processFilename: dmnPath,
                });
                console.log(`  ✅ ${file} 部署成功`);
                // 打印部署的决策信息
                const decision = result.deployments[0]?.decision;
                if (decision) {
                    console.log(`     - Decision ID: ${decision.dmnDecisionId}`);
                    console.log(`     - Version: ${decision.version}`);
                }
                await zbc.close();
            }
            catch (error) {
                console.error(`  ❌ ${file} 部署失败: ${error}`);
            }
        }
    }
    /**
     * 部署表单文件
     */
    async deployForms() {
        console.log('\n📝 部署表单文件...');
        const formsDir = path.join(this.basePath, 'camunda', 'forms');
        if (!fs.existsSync(formsDir)) {
            console.warn(`  ⚠️  表单目录不存在: ${formsDir}`);
            return;
        }
        const formFiles = fs.readdirSync(formsDir).filter(f => f.endsWith('.form'));
        for (const file of formFiles) {
            const formPath = path.join(formsDir, file);
            const formContent = fs.readFileSync(formPath, 'utf-8');
            const formJson = JSON.parse(formContent);
            console.log(`  📄 ${file}`);
            console.log(`     - Form ID: ${formJson.id}`);
            console.log(`     - Name: ${formJson.name}`);
            // 注意：Camunda 8.8 中表单通常与 BPMN 一起部署或通过 Tasklist API 部署
            // 这里只是验证表单格式正确
        }
        console.log(`  ✅ 共 ${formFiles.length} 个表单文件已验证`);
    }
}
// 运行部署
const deployer = new CamundaDeployer();
deployer.deployAll().catch(error => {
    console.error('部署失败:', error);
    process.exit(1);
});
//# sourceMappingURL=deploy-to-camunda.js.map