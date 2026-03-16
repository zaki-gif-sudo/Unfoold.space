import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import pb from '../lib/pocketbaseClient';
import { CheckCircle, Clock, AlertCircle, Bell, Calendar, CreditCard, Users, XCircle, Volume2, MapPin, Cigarette, Wind, Home } from 'lucide-react';

// Kasir notification sound - alert beep for new orders
let kasirAudioCtx = null;
const playKasirSound = () => {
  try {
    if (!kasirAudioCtx || kasirAudioCtx.state === 'closed') {
      kasirAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (kasirAudioCtx.state === 'suspended') kasirAudioCtx.resume();
    const now = kasirAudioCtx.currentTime;
    // Double beep alert
    [0, 0.25].forEach(delay => {
      const osc = kasirAudioCtx.createOscillator();
      const gain = kasirAudioCtx.createGain();
      osc.connect(gain);
      gain.connect(kasirAudioCtx.destination);
      osc.type = 'square';
      osc.frequency.value = 1000;
      gain.gain.setValueAtTime(0.3, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
  } catch (e) {}
};

const ZONE_CONFIG = {
  smoking_indoor: { label: 'Smoking Indoor', icon: Cigarette, color: 'amber', pax: 20 },
  smoking_outdoor: { label: 'Smoking Outdoor', icon: Wind, color: 'emerald', pax: 30 },
  indoor: { label: 'Indoor (Non-Smoking)', icon: Home, color: 'blue', pax: 20 },
};

const KasirDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [filter, setFilter] = useState('all');
  const [searchId, setSearchId] = useState('');
  const isFirstLoad = useRef(true);

  useEffect(() => {
    fetchAll().then(() => { isFirstLoad.current = false; });
    const interval = setInterval(fetchAll, 10000);

    // Realtime: auto-refresh when orders change + sound on new order
    let unsubOrders;
    pb.collection('orders').subscribe('*', (e) => {
      if (e.action === 'create' && !isFirstLoad.current) {
        playKasirSound();
      }
      fetchOrders();
    }, { $autoCancel: false }).then(unsub => { unsubOrders = unsub; });

    let unsubRes;
    pb.collection('reservations').subscribe('*', (e) => {
      if (e.action === 'create' && !isFirstLoad.current) {
        playKasirSound();
      }
      fetchReservations();
      fetchTables();
    }, { $autoCancel: false }).then(unsub => { unsubRes = unsub; });

    // Realtime tables
    pb.collection('tables').subscribe('*', () => {
      fetchTables();
    }, { $autoCancel: false });

    return () => {
      clearInterval(interval);
      pb.collection('orders').unsubscribe('*');
      pb.collection('reservations').unsubscribe('*');
      pb.collection('tables').unsubscribe('*');
    };
  }, []);

  const fetchAll = async () => {
    await Promise.all([fetchOrders(), fetchReservations(), fetchTables()]);
    setLoading(false);
  };

  const getCustomerName = (record) => {
    return record.customerName || record.customerEmail || 'Customer';
  };

  const fetchOrders = async () => {
    try {
      const records = await pb.collection('orders').getList(1, 200, {
        sort: '-created',
        $autoCancel: false,
      });
      const items = records.items;
      setOrders(items);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Gagal memuat pesanan: ' + (err?.message || err));
    }
  };

  const fetchReservations = async () => {
    try {
      const records = await pb.collection('reservations').getList(1, 200, {
        sort: '-created',
        $autoCancel: false,
      });
      const items = records.items;
      setReservations(items);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  };

  const fetchTables = async () => {
    try {
      const records = await pb.collection('tables').getList(1, 100, {
        sort: 'area,table_number',
        $autoCancel: false,
      });
      setTables(records.items);
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  const toggleTableStatus = async (table) => {
    const nextStatus = table.status === 'available' ? 'occupied' : 'available';
    try {
      await pb.collection('tables').update(table.id, {
        status: nextStatus,
        current_reservation: nextStatus === 'available' ? '' : table.current_reservation,
      });
      fetchTables();
    } catch (err) {
      console.error('Error updating table:', err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await pb.collection('orders').update(orderId, { status: newStatus });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const updateReservationStatus = async (reservationId, newStatus) => {
    try {
      // Get the reservation first to find its table_id
      const res = reservations.find(r => r.id === reservationId);
      await pb.collection('reservations').update(reservationId, { status: newStatus });

      // Set table to reserved when confirming
      if (newStatus === 'confirmed' && res?.table_id) {
        try {
          await pb.collection('tables').update(res.table_id, {
            status: 'reserved',
            current_reservation: reservationId,
          });
        } catch (e) {
          console.warn('Could not reserve table:', e);
        }
      }

      // Free the table when cancelling or completing
      if ((newStatus === 'cancelled' || newStatus === 'completed') && res?.table_id) {
        try {
          await pb.collection('tables').update(res.table_id, {
            status: 'available',
            current_reservation: '',
          });
        } catch (e) {
          console.warn('Could not free table:', e);
        }
      }

      fetchReservations();
      fetchTables();
    } catch (error) {
      console.error('Error updating reservation:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-700 border-yellow-200';
      case 'ready': return 'bg-green-500/20 text-green-700 border-green-200';
      case 'completed': case 'confirmed': return 'bg-blue-500/20 text-blue-700 border-blue-200';
      case 'cancelled': return 'bg-red-500/20 text-red-700 border-red-200';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'ready': case 'confirmed': return <CheckCircle size={16} className="text-green-600" />;
      case 'completed': return <CheckCircle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return null;
    }
  };

  // Order filters
  const getFilteredOrders = () => {
    let filtered = orders;
    if (filter !== 'all') {
      filtered = orders.filter(o => o.status === filter);
    }
    if (searchId) {
      filtered = filtered.filter(o => o.id.toLowerCase().includes(searchId.toLowerCase()));
    }
    return filtered;
  };

  // Reservation filters
  const getFilteredReservations = () => {
    let filtered = reservations;
    if (filter !== 'all') {
      const statusMap = { pending: 'pending', ready: 'confirmed', completed: 'confirmed', confirmed: 'confirmed', cancelled: 'cancelled' };
      filtered = reservations.filter(r => r.status === (statusMap[filter] || filter));
    }
    if (searchId) {
      filtered = filtered.filter(r => r.id.toLowerCase().includes(searchId.toLowerCase()));
    }
    return filtered;
  };

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;
  const pendingReservations = reservations.filter(r => r.status === 'pending').length;

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
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Kasir Dashboard</h1>
              <p className="text-sm text-muted-foreground">Kelola pesanan & reservasi</p>
            </div>
            <div className="flex items-center gap-3">
              {(pendingOrders > 0 || pendingReservations > 0) && (
                <div className="relative">
                  <Bell className="text-yellow-600 animate-bounce" size={24} />
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingOrders + pendingReservations}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-yellow-500/10 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Pesanan Pending</p>
              <p className="text-xl font-bold text-yellow-700">{pendingOrders}</p>
            </div>
            <div className="bg-green-500/10 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Siap Diambil</p>
              <p className="text-xl font-bold text-green-700">{readyOrders}</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Reservasi Pending</p>
              <p className="text-xl font-bold text-purple-700">{pendingReservations}</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total Pesanan</p>
              <p className="text-xl font-bold text-blue-700">{orders.length}</p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-300 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab('orders'); setFilter('pending'); }}
              className={`px-4 py-2 rounded-t-lg font-medium transition ${
                activeTab === 'orders' ? 'bg-background text-foreground border border-b-0 border-border' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CreditCard size={16} className="inline mr-2" />
              Pesanan {pendingOrders > 0 && <span className="ml-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingOrders}</span>}
            </button>
            <button
              onClick={() => { setActiveTab('reservations'); setFilter('pending'); }}
              className={`px-4 py-2 rounded-t-lg font-medium transition ${
                activeTab === 'reservations' ? 'bg-background text-foreground border border-b-0 border-border' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar size={16} className="inline mr-2" />
              Reservasi {pendingReservations > 0 && <span className="ml-1 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingReservations}</span>}
            </button>
            <button
              onClick={() => { setActiveTab('seatmap'); }}
              className={`px-4 py-2 rounded-t-lg font-medium transition ${
                activeTab === 'seatmap' ? 'bg-background text-foreground border border-b-0 border-border' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MapPin size={16} className="inline mr-2" />
              Denah Meja
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3 items-center">
          {activeTab === 'orders' ? (
            <div className="flex gap-2">
              {['pending', 'ready', 'completed', 'cancelled', 'all'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition ${
                    filter === f ? 'bg-primary text-white border-primary' : 'bg-background border-border text-foreground hover:bg-secondary'
                  }`}>
                  {f === 'all' ? 'Semua' : f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === 'pending' && ` (${pendingOrders})`}
                  {f === 'ready' && ` (${readyOrders})`}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              {['pending', 'confirmed', 'cancelled', 'all'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition ${
                    filter === f ? 'bg-primary text-white border-primary' : 'bg-background border-border text-foreground hover:bg-secondary'
                  }`}>
                  {f === 'all' ? 'Semua' : f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === 'pending' && ` (${pendingReservations})`}
                </button>
              ))}
            </div>
          )}
          <input
            type="text"
            placeholder="Cari ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 min-w-[150px] px-3 py-1.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <>
            {getFilteredOrders().length === 0 ? (
              <div className="text-center py-16">
                <AlertCircle size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">Tidak ada pesanan di kategori ini</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredOrders().map((order) => (
                  <div key={order.id}
                    className={`bg-card border-2 rounded-xl p-5 shadow-md transition ${
                      order.status === 'ready' ? 'border-green-500 shadow-green-500/20'
                        : order.status === 'pending' ? 'border-yellow-400 shadow-yellow-400/20'
                        : 'border-border'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Customer</p>
                        <p className="font-semibold text-foreground text-sm">{getCustomerName(order)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Waktu Ambil</p>
                        <p className="text-sm text-foreground">{order.pickupTime || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Items</p>
                        <div className="space-y-0.5">
                          {order.items && order.items.map((item, idx) => (
                            <p key={idx} className="text-sm text-foreground">
                              • {item.name} x{item.quantity}
                              {item.customization?.size && ` (${item.customization.size})`}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-bold text-primary">Rp {order.totalPrice?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Waktu Order</p>
                        <p className="text-xs text-foreground">{new Date(order.created).toLocaleString('id-ID')}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {order.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateOrderStatus(order.id, 'ready')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition text-sm flex items-center justify-center gap-1">
                            <CheckCircle size={14} /> Siap
                          </button>
                          <button onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            className="px-3 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition text-sm">
                            <XCircle size={14} />
                          </button>
                        </div>
                      )}
                      {order.status === 'ready' && (
                        <button onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition text-sm">
                          Selesai / Diambil
                        </button>
                      )}
                      {order.status === 'completed' && (
                        <p className="text-center text-sm text-green-600 py-1 font-medium">✓ Selesai</p>
                      )}
                      {order.status === 'cancelled' && (
                        <p className="text-center text-sm text-red-600 py-1 font-medium">✗ Dibatalkan</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* RESERVATIONS TAB */}
        {activeTab === 'reservations' && (
          <>
            {getFilteredReservations().length === 0 ? (
              <div className="text-center py-16">
                <AlertCircle size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">Tidak ada reservasi di kategori ini</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredReservations().map((res) => (
                  <div key={res.id}
                    className={`bg-card border-2 rounded-xl p-5 shadow-md transition ${
                      res.status === 'pending' ? 'border-yellow-400 shadow-yellow-400/20'
                        : res.status === 'confirmed' ? 'border-green-500 shadow-green-500/20'
                        : 'border-border'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getStatusColor(res.status)}`}>
                        {getStatusIcon(res.status)}
                        {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">#{res.id.slice(0, 8).toUpperCase()}</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Customer</p>
                        <p className="font-semibold text-foreground text-sm">{getCustomerName(res)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Tanggal</p>
                          <p className="text-sm font-medium text-foreground">{res.date ? new Date(res.date).toLocaleDateString('id-ID') : '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Waktu</p>
                          <p className="text-sm font-medium text-foreground">{res.time || '-'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Tipe Tempat</p>
                          <p className="text-sm text-foreground">{res.seatType || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Jumlah Tamu</p>
                          <p className="text-sm text-foreground"><Users size={14} className="inline mr-1" />{res.numberOfGuests || '-'}</p>
                        </div>
                      </div>
                      {res.specialRequests && (
                        <div>
                          <p className="text-xs text-muted-foreground">Catatan</p>
                          <p className="text-sm text-foreground italic">{res.specialRequests}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {res.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateReservationStatus(res.id, 'confirmed')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition text-sm flex items-center justify-center gap-1">
                            <CheckCircle size={14} /> Konfirmasi
                          </button>
                          <button onClick={() => updateReservationStatus(res.id, 'cancelled')}
                            className="px-3 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition text-sm">
                            <XCircle size={14} />
                          </button>
                        </div>
                      )}
                      {res.status === 'confirmed' && (
                        <p className="text-center text-sm text-green-600 py-1 font-medium">✓ Dikonfirmasi</p>
                      )}
                      {res.status === 'cancelled' && (
                        <p className="text-center text-sm text-red-600 py-1 font-medium">✗ Dibatalkan</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* SEAT MAP TAB */}
        {activeTab === 'seatmap' && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(ZONE_CONFIG).map(([zone, config]) => {
                const zoneTables = tables.filter(t => t.area === zone);
                const available = zoneTables.filter(t => t.status === 'available').length;
                const occupied = zoneTables.filter(t => t.status !== 'available').length;
                const Icon = config.icon;
                return (
                  <div key={zone} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={16} className="text-muted-foreground" />
                      <span className="text-sm font-bold text-foreground">{config.label}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-xs"><span className="font-bold text-green-600">{available}</span> kosong</span>
                      <span className="text-xs"><span className="font-bold text-red-500">{occupied}</span> terisi</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Total {config.pax} pax</p>
                  </div>
                );
              })}
            </div>

            {/* Seat Maps by Zone */}
            {Object.entries(ZONE_CONFIG).map(([zone, config]) => {
              const zoneTables = tables.filter(t => t.area === zone);
              const Icon = config.icon;
              return (
                <div key={zone} className="bg-card border border-border rounded-2xl p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon size={18} className="text-muted-foreground" />
                      <h3 className="font-bold text-foreground">{config.label}</h3>
                      <span className="text-xs text-muted-foreground">({config.pax} pax)</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 md:gap-3 justify-center py-4 px-2 bg-muted/30 rounded-xl border border-border/50 min-h-[80px]">
                    {zoneTables.map(table => {
                      const isAvailable = table.status === 'available';
                      return (
                        <button
                          key={table.id}
                          onClick={() => toggleTableStatus(table)}
                          className={`w-16 h-16 md:w-20 md:h-20 rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all duration-200 border-2 ${
                            isAvailable
                              ? 'bg-green-500/10 text-green-700 border-green-300 hover:bg-green-500/20'
                              : 'bg-red-500/15 text-red-600 border-red-300 hover:bg-red-500/25'
                          }`}
                          title={`${table.table_number} - Klik untuk ${isAvailable ? 'tandai terisi' : 'tandai kosong'}`}
                        >
                          <span className="text-sm md:text-base leading-tight">{table.table_number.split('-')[1]}</span>
                          <span className="text-[9px] md:text-[10px] opacity-70 mt-0.5">{table.capacity}p</span>
                          <span className={`text-[8px] md:text-[9px] font-medium mt-0.5 ${isAvailable ? 'text-green-600' : 'text-red-500'}`}>
                            {isAvailable ? 'KOSONG' : table.status === 'reserved' ? 'BOOKING' : 'TERISI'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-green-500/10 border-2 border-green-300 inline-block"></span> Kosong</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-red-500/15 border-2 border-red-300 inline-block"></span> Terisi/Booking</span>
              <span className="text-[10px] italic">Klik meja untuk toggle status</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KasirDashboard;
