import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import supabase from '@/lib/supabase';
import './ShopAdmin.css';

interface AdminEvent {
  id: string;
  type: string;
  phone_number: string;
  count: number;
  last_contact: string;
  created_at: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  total_price: number;
  status: string;
  created_at: string;
}

export default function ShopAdmin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'calls' | 'messages' | 'orders'>('calls');
  const [calls, setCalls] = useState<AdminEvent[]>([]);
  const [messages, setMessages] = useState<AdminEvent[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('shopAdminAuth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      loadAdminData();
    }
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      loadAdminData();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admindosik180907') {
      setIsAuthenticated(true);
      localStorage.setItem('shopAdminAuth', 'true');
      setPassword('');
      loadAdminData();
    } else {
      alert('❌ Неправильный пароль');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('shopAdminAuth');
    setPassword('');
    navigate('/shop');
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Load calls
      const { data: callsData } = await supabase
        .from('admin_events')
        .select('*')
        .eq('type', 'phone_call')
        .order('created_at', { ascending: false });
      setCalls(callsData || []);

      // Load messages
      const { data: messagesData } = await supabase
        .from('admin_events')
        .select('*')
        .eq('type', 'whatsapp_message')
        .order('created_at', { ascending: false });
      setMessages(messagesData || []);

      // Load orders
      const { data: ordersData } = await supabase
        .from('shop_orders')
        .select('*')
        .order('created_at', { ascending: false });
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAdminData();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await supabase
        .from('shop_orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      loadAdminData();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('❌ Ошибка при обновлении заказа');
    }
  };

  // Login Page
  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <h1>🔐 Админ Панель</h1>
            <p>reverseX Shop Administration</p>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="form-group">
              <label htmlFor="password">Пароль:</label>
              <input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="password-input"
                autoFocus
              />
            </div>

            <Button type="submit" className="admin-login-btn" size="lg">
              Вход
            </Button>

            <Button
              type="button"
              variant="outline"
              className="admin-back-btn"
              onClick={() => navigate('/shop')}
            >
              ← Вернуться на главную
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>⚙️ Админ Панель</h1>
          <p>reverseX Shop Management</p>
        </div>
        <div className="admin-header-actions">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
          >
            🔄 Обновить
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
          >
            Выход
          </Button>
        </div>
      </div>

      <div className="admin-tabs">
        <Button
          variant={activeTab === 'calls' ? 'default' : 'outline'}
          onClick={() => setActiveTab('calls')}
          className="tab-btn"
        >
          📞 Звонки ({calls.length})
        </Button>
        <Button
          variant={activeTab === 'messages' ? 'default' : 'outline'}
          onClick={() => setActiveTab('messages')}
          className="tab-btn"
        >
          💬 WhatsApp ({messages.length})
        </Button>
        <Button
          variant={activeTab === 'orders' ? 'default' : 'outline'}
          onClick={() => setActiveTab('orders')}
          className="tab-btn"
        >
          📦 Заказы ({orders.length})
        </Button>
      </div>

      <div className="admin-content">
        {/* Calls Tab */}
        {activeTab === 'calls' && (
          <div className="admin-section">
            <h2>📞 Входящие звонки</h2>
            {calls.length === 0 ? (
              <div className="empty-state">
                <p>Нет звонков</p>
              </div>
            ) : (
              <div className="event-list">
                {calls.map((call) => (
                  <div key={call.id} className="event-item">
                    <div className="event-info">
                      <div className="event-number">
                        <span className="icon">📱</span>
                        <span className="number">{call.phone_number}</span>
                      </div>
                      <div className="event-details">
                        <span className="count">Звонков: <strong>{call.count}</strong></span>
                        <span className="time">
                          Последний: {new Date(call.last_contact).toLocaleString('ru-RU')}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = `tel:${call.phone_number}`}
                    >
                      Позвонить
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="admin-section">
            <h2>💬 WhatsApp сообщения</h2>
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>Нет сообщений</p>
              </div>
            ) : (
              <div className="event-list">
                {messages.map((msg) => (
                  <div key={msg.id} className="event-item">
                    <div className="event-info">
                      <div className="event-number">
                        <span className="icon">💬</span>
                        <span className="number">{msg.phone_number}</span>
                      </div>
                      <div className="event-details">
                        <span className="count">Сообщений: <strong>{msg.count}</strong></span>
                        <span className="time">
                          Последнее: {new Date(msg.last_contact).toLocaleString('ru-RU')}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = `https://wa.me/${msg.phone_number.replace(/[^0-9]/g, '')}`}
                    >
                      WhatsApp
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="admin-section">
            <h2>📦 Заказы</h2>
            {orders.length === 0 ? (
              <div className="empty-state">
                <p>Нет заказов</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order.id} className="order-item">
                    <div className="order-header">
                      <div className="order-id">
                        <span className="label">№ Заказа:</span>
                        <span className="value">{order.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div className={`order-status status-${order.status}`}>
                        {order.status === 'pending' && '⏳ В ожидании'}
                        {order.status === 'confirmed' && '✓ Подтверждён'}
                        {order.status === 'delivered' && '✓✓ Доставлен'}
                        {order.status === 'cancelled' && '✗ Отменён'}
                      </div>
                    </div>

                    <div className="order-details">
                      <div className="detail-item">
                        <span className="label">Заказчик:</span>
                        <span className="value">{order.customer_name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Телефон:</span>
                        <span className="value">
                          <a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a>
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Сумма:</span>
                        <span className="value price">₸ {order.total_price.toLocaleString()}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Дата:</span>
                        <span className="value">
                          {new Date(order.created_at).toLocaleString('ru-RU')}
                        </span>
                      </div>
                    </div>

                    <div className="order-actions">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          >
                            ✓ Подтвердить
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          >
                            ✗ Отменить
                          </Button>
                        </>
                      )}
                      {order.status === 'confirmed' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                        >
                          ✓✓ Доставлен
                        </Button>
                      )}
                      {(order.status === 'delivered' || order.status === 'cancelled') && (
                        <span className="status-complete">Завершено</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-indicator">
          <p>⏳ Загрузка...</p>
        </div>
      )}
    </div>
  );
}
