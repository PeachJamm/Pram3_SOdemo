// =====================================================
// SO Create Page - React Version
// 原 so-create.html 转换的 React 组件
// =====================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface Customer {
  id: string;
  name: string;
  code: string;
  tier: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
  unitPrice: number;
}

interface ProductLine {
  id: number;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export default function SOCreatePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [lineCounter, setLineCounter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Form data
  const [customerId, setCustomerId] = useState('');
  const [orderDate] = useState(new Date().toISOString().split('T')[0]);
  const [priceListCode, setPriceListCode] = useState('');
  const salesperson = 'sales01';

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (customers.length > 0 && products.length > 0) {
      addProductLine();
    }
  }, [customers, products]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/orders/create-data');
      if (data.success) {
        setCustomers(data.data.customers);
        setProducts(data.data.products);
      }
    } catch (error) {
      showNotification('加载数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const customer = customers.find(c => c.id === id);
    if (customer) {
      setPriceListCode(
        customer.tier === 'VIP' ? 'VIP价格表' :
        customer.tier === 'GOLD' ? '金牌价格表' : '标准价格表'
      );
    }
    recalculateAllLines();
  };

  const addProductLine = () => {
    const newId = lineCounter + 1;
    setLineCounter(newId);
    setProductLines([...productLines, {
      id: newId,
      productId: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0
    }]);
  };

  const updateProductLine = (lineId: number, field: keyof ProductLine, value: string | number) => {
    setProductLines(lines => lines.map(line => {
      if (line.id === lineId) {
        const updated = { ...line, [field]: value };
        if (field === 'productId') {
          const product = products.find(p => p.id === value);
          if (product) {
            updated.unitPrice = product.unitPrice || 100;
          }
        }
        return updated;
      }
      return line;
    }));
  };

  const removeLine = (lineId: number) => {
    setProductLines(lines => lines.filter(l => l.id !== lineId));
  };

  const recalculateAllLines = () => {
    // Triggered when customer changes, recalculate if needed
  };

  const calculateLineTotal = (line: ProductLine) => {
    return line.quantity * line.unitPrice * (1 - line.discount / 100);
  };

  const calculateTotals = () => {
    const subtotal = productLines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
    const taxRate = 0.06;
    const taxAmount = subtotal * taxRate;
    const grandTotal = subtotal + taxAmount;
    return { subtotal, taxAmount, grandTotal };
  };

  const { subtotal, taxAmount, grandTotal } = calculateTotals();

  const submitOrder = async () => {
    if (!customerId) {
      showNotification('请选择客户', 'error');
      return;
    }

    const validLines = productLines.filter(l => l.productId && l.quantity > 0);
    if (validLines.length === 0) {
      showNotification('请至少添加一个产品', 'error');
      return;
    }

    const customer = customers.find(c => c.id === customerId);
    const orderData = {
      customerId: customerId,
      customerName: customer?.name || '',
      customerTier: customer?.tier || 'STANDARD',
      items: validLines.map(l => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discount: l.discount
      })),
      totalAmount: grandTotal
    };

    setLoading(true);
    try {
      const data = await api.post('/orders/create-and-start', orderData);
      if (data.success) {
        showNotification(`订单创建成功！订单号: ${data.data.orderNumber}`, 'success');
        setTimeout(() => navigate('/so-list'), 2000);
      } else {
        showNotification('创建失败: ' + (data.error || '未知错误'), 'error');
      }
    } catch (error: any) {
      showNotification('提交失败: ' + (error.message || '网络错误'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* 顶部导航 */}
      <nav style={{
        background: 'linear-gradient(135deg, #714b67 0%, #5a3a52 100%)',
        color: 'white',
        height: '46px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <span style={{ fontSize: '18px', fontWeight: 600 }}>PRAM3 ERP</span>
      </nav>

      {/* 控制面板 */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 500, color: '#333', margin: 0 }}>📋 新建销售订单</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor: '#fff3cd',
            color: '#856404'
          }}>草稿</span>
          <button onClick={() => navigate('/so-list')} style={{
            padding: '8px 20px',
            border: '1px solid #ddd',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            backgroundColor: '#f8f9fa',
            color: '#333'
          }}>放弃</button>
          <button onClick={submitOrder} style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            backgroundColor: '#714b67',
            color: 'white'
          }}>提交审批</button>
        </div>
      </div>

      {/* 主内容 */}
      <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          padding: '30px'
        }}>
          {/* 基本信息 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px 40px',
            marginBottom: '25px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '13px', color: '#666', marginBottom: '5px', fontWeight: 500 }}>客户 *</label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">选择客户...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.tier})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '13px', color: '#666', marginBottom: '5px', fontWeight: 500 }}>订单日期</label>
              <input
                type="date"
                value={orderDate}
                readOnly
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#f8f9fa'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '13px', color: '#666', marginBottom: '5px', fontWeight: 500 }}>价格表</label>
              <input
                type="text"
                value={priceListCode}
                readOnly
                placeholder="自动选择"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#f8f9fa'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '13px', color: '#666', marginBottom: '5px', fontWeight: 500 }}>销售员</label>
              <input
                type="text"
                value={salesperson}
                readOnly
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#f8f9fa'
                }}
              />
            </div>
          </div>

          {/* 产品行 */}
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '15px', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
              订单明细
              <button onClick={addProductLine} style={{
                padding: '5px 12px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '3px',
                cursor: 'pointer',
                backgroundColor: '#f8f9fa',
                color: '#333'
              }}>+ 添加产品</button>
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', padding: '12px 10px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#666', width: '35%' }}>产品</th>
                  <th style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', padding: '12px 10px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#666', width: '15%' }}>单价</th>
                  <th style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', padding: '12px 10px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#666', width: '12%' }}>数量</th>
                  <th style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', padding: '12px 10px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#666', width: '10%' }}>折扣%</th>
                  <th style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', padding: '12px 10px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#666', width: '15%' }}>小计</th>
                  <th style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', padding: '12px 10px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#666', width: '8%' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {productLines.map((line) => (
                  <tr key={line.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '10px' }}>
                      <select
                        value={line.productId}
                        onChange={(e) => updateProductLine(line.id, 'productId', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '13px' }}
                      >
                        <option value="">选择产品...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <input
                        type="number"
                        value={line.unitPrice}
                        readOnly
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '13px', backgroundColor: '#f8f9fa', textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ padding: '10px' }}>
                      <input
                        type="number"
                        value={line.quantity}
                        min={1}
                        onChange={(e) => updateProductLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '13px', textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ padding: '10px' }}>
                      <input
                        type="number"
                        value={line.discount}
                        min={0}
                        max={100}
                        onChange={(e) => updateProductLine(line.id, 'discount', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '13px', textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ padding: '10px', fontWeight: 600 }}>
                      ¥{calculateLineTotal(line).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => removeLine(line.id)} style={{
                        padding: '6px 10px',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        fontSize: '12px'
                      }}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 汇总 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e9ecef' }}>
            <table style={{ width: '350px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 10px', fontSize: '14px', textAlign: 'right', color: '#666' }}>小计:</td>
                  <td style={{ padding: '8px 10px', fontSize: '14px', textAlign: 'right', fontWeight: 600 }}>¥{subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px', fontSize: '14px', textAlign: 'right', color: '#666' }}>税费 (6%):</td>
                  <td style={{ padding: '8px 10px', fontSize: '14px', textAlign: 'right', fontWeight: 600 }}>¥{taxAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 10px', fontSize: '16px', textAlign: 'right', color: '#714b67', fontWeight: 700, borderTop: '2px solid #dee2e6' }}>总计:</td>
                  <td style={{ padding: '12px 10px', fontSize: '16px', textAlign: 'right', color: '#714b67', fontWeight: 700, borderTop: '2px solid #dee2e6' }}>¥{grandTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 加载动画 */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255,255,255,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #714b67',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      )}

      {/* 提示消息 */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '60px',
          right: '20px',
          padding: '15px 20px',
          borderRadius: '4px',
          color: 'white',
          fontSize: '14px',
          zIndex: 1001,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          backgroundColor: notification.type === 'success' ? '#28a745' : '#dc3545'
        }}>
          {notification.message}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
