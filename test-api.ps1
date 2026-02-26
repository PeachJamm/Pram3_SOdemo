# PRAM3 API 测试脚本

Write-Host "=== PRAM3 API 测试 ===" -ForegroundColor Green

# 1. 健康检查
Write-Host "`n1. 测试健康检查端点..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
    Write-Host "   ✓ 服务运行正常" -ForegroundColor Green
    Write-Host "   状态: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ 服务未启动或无法连接" -ForegroundColor Red
    exit 1
}

# 2. 测试表单渲染API (APPROVE权限 - 销售经理)
Write-Host "`n2. 测试表单渲染API (salesmgr01 - APPROVE权限)..." -ForegroundColor Yellow
try {
    $form = Invoke-RestMethod -Uri "http://localhost:3001/api/forms/task-validation-001/render?userId=user-003" -TimeoutSec 5
    if ($form.success) {
        Write-Host "   ✓ 表单渲染成功" -ForegroundColor Green
        Write-Host "   表单ID: $($form.data.formId)" -ForegroundColor Gray
        Write-Host "   权限级别: $($form.data.permissionLevel)" -ForegroundColor Gray
        Write-Host "   用户: $($form.data.userInfo.username) ($($form.data.userInfo.role))" -ForegroundColor Gray
        Write-Host "   组件数: $($form.data.components.Count)" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ 表单渲染失败: $($form.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ 请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. 测试表单渲染API (VIEW权限 - 客服)
Write-Host "`n3. 测试表单渲染API (cs01 - VIEW权限)..." -ForegroundColor Yellow
try {
    $form = Invoke-RestMethod -Uri "http://localhost:3001/api/forms/task-validation-001/render?userId=user-006" -TimeoutSec 5
    if ($form.success) {
        Write-Host "   ✓ 表单渲染成功" -ForegroundColor Green
        Write-Host "   权限级别: $($form.data.permissionLevel)" -ForegroundColor Gray
        # 检查审批字段是否隐藏
        $approvalField = $form.data.components | Where-Object { $_.key -eq "validationResult" }
        if ($approvalField -and $approvalField.properties.permission.VIEW.visible -eq $false) {
            Write-Host "   ✓ VIEW用户看不到审批字段 (符合预期)" -ForegroundColor Green
        }
    } else {
        Write-Host "   ✗ 表单渲染失败: $($form.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ 请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. 测试表单Schema API
Write-Host "`n4. 测试表单Schema API..." -ForegroundColor Yellow
try {
    $schema = Invoke-RestMethod -Uri "http://localhost:3001/api/forms/schema/order-validation" -TimeoutSec 5
    if ($schema.success) {
        Write-Host "   ✓ Schema获取成功" -ForegroundColor Green
        Write-Host "   表单: $($schema.data.formName)" -ForegroundColor Gray
        Write-Host "   字段数: $($schema.data.fields.Count)" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ Schema获取失败: $($schema.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ 请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. 测试待办任务API
Write-Host "`n5. 测试待办任务API (salesmgr01)..." -ForegroundColor Yellow
try {
    $tasks = Invoke-RestMethod -Uri "http://localhost:3001/api/forms/tasks/pending?userId=user-003" -TimeoutSec 5
    if ($tasks.success) {
        Write-Host "   ✓ 待办任务获取成功" -ForegroundColor Green
        Write-Host "   任务数: $($tasks.data.taskCount)" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ 获取失败: $($tasks.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ 请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== 测试完成 ===" -ForegroundColor Green
