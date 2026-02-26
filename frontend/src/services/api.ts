// =====================================================
// API Service
// HTTP请求服务
// =====================================================

import axios from 'axios';
import type { ApiResponse, RenderedForm, PendingTask, SalesOrder } from '../types';

const API_BASE_URL = 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加用户ID
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('pram3_user');
  if (user) {
    const { id } = JSON.parse(user);
    config.headers['X-User-Id'] = id;
  }
  return config;
});

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// 表单API (路径相对于 /api/v1，但实际表单API在 /api 下，需要完整URL)
export const formApi = {
  // 渲染表单
  renderForm: (taskId: string, userId: string): Promise<ApiResponse<RenderedForm>> =>
    api.get(`http://localhost:3001/api/forms/${taskId}/render`, { params: { userId } }),

  // 提交表单
  submitForm: (taskId: string, userId: string, variables: Record<string, any>): Promise<ApiResponse<any>> =>
    api.post(`http://localhost:3001/api/forms/${taskId}/submit`, { userId, variables }),

  // 获取表单Schema
  getFormSchema: (formKey: string): Promise<ApiResponse<any>> =>
    api.get(`http://localhost:3001/api/forms/schema/${formKey}`),

  // 获取待办任务
  getPendingTasks: (userId: string): Promise<ApiResponse<{ tasks: PendingTask[] }>> =>
    api.get('http://localhost:3001/api/forms/tasks/pending', { params: { userId } }),

  // 根据订单ID获取任务
  getTaskByOrderId: (orderId: string, userId: string): Promise<ApiResponse<any>> =>
    api.get(`http://localhost:3001/api/forms/tasks/by-order/${orderId}`, { params: { userId } }),
};

// 订单API (路径相对于 /api/v1)
export const orderApi = {
  // 获取SO列表
  getOrders: (params?: { status?: string; page?: number; pageSize?: number }): Promise<ApiResponse<{ orders: SalesOrder[] }>> =>
    api.get('/orders', { params }),

  // 获取SO详情
  getOrderById: (id: string): Promise<ApiResponse<{ order: SalesOrder }>> =>
    api.get(`/orders/${id}/details`),

  // 创建SO并启动流程
  createOrder: (data: any): Promise<ApiResponse<any>> =>
    api.post('/orders/create-and-start', data),
};

// 健康检查 (在根路径)
export const healthCheck = (): Promise<ApiResponse<{ status: string }>> =>
  api.get('http://localhost:3001/health');
