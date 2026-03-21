import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import pb from '../lib/pocketbaseClient';
import { CheckCircle, Clock, AlertCircle, Bell } from 'lucide-react';

const KasirDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, ready, completed
  const [searchId, setSearchId] = useState('');

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // refresh setiap 5 detik
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const records = await pb.collection('orders').getList(1, 50, {
        sort: '-created_at',
        expand: 'user_id',
      });
      setOrders(records.items);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await pb.collection('orders').update(orderId, { status: newStatus });
      // Trigger notification jika order ready
      if (newStatus === 'ready') {
        notifyCustomer(orderId, 'Pesanan Anda siap diambil!');
      }
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const notifyCustomer = async (orderId, message) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (order?.user_id) {
        // Create notification record
        await pb.collection('notifications').create({
          user_id: order.user_id,
          title: 'Pesanan Siap',
          message: message,
          type: 'order_ready',
          read: false,
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const getFilteredOrders = () => {
    let filtered = orders;
    
    if (filter === 'pending') {
      filtered = orders.filter(o => o.status === 'pending');
    } else if (filter === 'ready') {
      filtered = orders.filter(o => o.status === 'ready');
    } else if (filter === 'completed') {
      filtered = orders.filter(o => o.status === 'completed');
    }

    if (searchId) {
      filtered = filtered.filter(o => o.id.includes(searchId));
    }

    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-700 border-yellow-200';
      case 'ready': return 'bg-green-500/20 text-green-700 border-green-200';
      case 'completed': return 'bg-blue-500/20 text-blue-700 border-blue-200';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'ready': return <CheckCircle size={16} className="text-green-600" />;
      case 'completed': return <CheckCircle size={16} />;
      default: return null;
    }
  };

  const filteredOrders = getFilteredOrders();
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Kasir Dashboard | Unfoold</title>
      </Helmet>

      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Kasir Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Kelola pesanan yang masuk</p>
            </div>
            <div className="flex items-center gap-4">
              {readyCount > 0 && (
                <div className="animated-pulse">
                  <Bell className="text-green-600 animate-bounce" size={24} />
                  <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {readyCount}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-yellow-500/10 border border-yellow-200 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Menunggu Proses</p>
              <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
            </div>
            <div className="bg-green-500/10 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Siap Diambil</p>
              <p className="text-2xl font-bold text-green-700">{readyCount}</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Total Pesanan Hari Ini</p>
              <p className="text-2xl font-bold text-blue-700">{orders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg border transition ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white border-yellow-600'
                  : 'bg-background border-border text-foreground hover:bg-secondary'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('ready')}
              className={`px-4 py-2 rounded-lg border transition ${
                filter === 'ready'
                  ? 'bg-green-500 text-white border-green-600'
                  : 'bg-background border-border text-foreground hover:bg-secondary'
              }`}
            >
              Ready ({readyCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg border transition ${
                filter === 'completed'
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-background border-border text-foreground hover:bg-secondary'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Cari Order ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">Tidak ada pesanan di kategori ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-card border-2 rounded-xl p-6 shadow-md transition ${
                  order.status === 'ready'
                    ? 'border-green-500 shadow-green-500/20'
                    : order.status === 'pending'
                    ? 'border-yellow-400 shadow-yellow-400/20'
                    : 'border-border'
                }`}
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                {/* Order Details */}
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-semibold text-foreground">
                      {order.expand?.user_id?.name || 'Unknown'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Items</p>
                    <div className="space-y-1">
                      {order.items && order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-foreground">
                          • {item.name} x{item.quantity}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold text-primary">Rp {order.totalPrice?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Mark as Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                    >
                      Mark as Completed
                    </button>
                  )}
                  {order.status === 'completed' && (
                    <p className="text-center text-sm text-muted-foreground py-2">✓ Selesai</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KasirDashboard;
