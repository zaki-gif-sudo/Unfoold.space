import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { Calendar, ShoppingBag, Award, Settings, Clock, CheckCircle, XCircle, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { withRetry } from '@/utils/apiErrorHandler.js';

const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
    <div className="lg:col-span-3 bg-card rounded-xl border border-border p-6 h-32"></div>
    <div className="bg-card rounded-xl border border-border p-6 h-64"></div>
    <div className="bg-card rounded-xl border border-border p-6 h-64"></div>
    <div className="bg-card rounded-xl border border-border p-6 h-64"></div>
  </div>
);

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resData, orderData, eventData] = await Promise.all([
        withRetry(() => pb.collection('reservations').getList(1, 50, {
          filter: `userId="${currentUser.id}"`,
          sort: '-date,-time',
          $autoCancel: false
        })),
        withRetry(() => pb.collection('orders').getList(1, 50, {
          filter: `userId="${currentUser.id}"`,
          sort: '-created',
          $autoCancel: false
        })),
        withRetry(() => pb.collection('events').getList(1, 50, {
          $autoCancel: false
        }))
      ]);

      setReservations(resData.items);
      setOrders(orderData.items);
      
      const userEvents = eventData.items.filter(ev => 
        ev.registeredUsers && ev.registeredUsers.includes(currentUser.id)
      );
      setEvents(userEvents);
      
      localStorage.setItem('cachedDashboard', JSON.stringify({
        reservations: resData.items,
        orders: orderData.items,
        events: userEvents
      }));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.userMessage || "Failed to load dashboard data.");
      
      const cached = localStorage.getItem('cachedDashboard');
      if (cached) {
        const parsed = JSON.parse(cached);
        setReservations(parsed.reservations);
        setOrders(parsed.orders);
        setEvents(parsed.events);
        setError("You are offline. Showing cached dashboard.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed':
      case 'confirmed':
      case 'ready':
        return <CheckCircle size={16} className="text-foreground" />;
      case 'cancelled':
        return <XCircle size={16} className="text-destructive" />;
      default:
        return <Clock size={16} className="text-muted-foreground" />;
    }
  };

  const points = currentUser?.loyaltyPoints || 0;
  const pointsToNextReward = 5 - (points % 5);
  const progressPercentage = ((5 - pointsToNextReward) / 5) * 100;

  return (
    <div className="min-h-screen bg-background py-12">
      <Helmet>
        <title>Dashboard | Unfoold Espresso</title>
      </Helmet>

      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Welcome back, {currentUser?.name || 'Coffee Lover'}</h1>
            <p className="text-muted-foreground mt-2">Here's what's happening with your Unfoold experience.</p>
          </div>
          <Link to="/profile" className="flex items-center space-x-2 px-4 py-2 bg-background border border-border rounded-md text-foreground hover:bg-muted transition-colors">
            <Settings size={18} />
            <span>Profile Settings</span>
          </Link>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle size={20} />
              <p className="font-medium">{error}</p>
            </div>
            <button onClick={fetchDashboardData} className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md text-sm font-medium hover:bg-muted transition-colors border border-border">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Loyalty Points Card */}
            <div className="lg:col-span-3 bg-card rounded-xl shadow-sm border border-border p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-muted rounded-full text-foreground border border-border">
                  <Award size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Loyalty Status</h3>
                  <p className="text-muted-foreground font-medium">{currentUser?.membershipLevel || 'Coffee Guest'}</p>
                </div>
              </div>
              <div className="flex-1 w-full max-w-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-foreground font-bold">{points} Points</span>
                  <span className="text-muted-foreground">{pointsToNextReward} more for a free coffee!</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 border border-border">
                  <div className="bg-foreground h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                </div>
              </div>
              <Link to="/menu" className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-md hover:opacity-90 transition-opacity whitespace-nowrap">
                Order Now
              </Link>
            </div>

            {/* Recent Orders */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <ShoppingBag size={20} />
                  Recent Orders
                </h3>
                <Link to="/menu" className="text-sm text-foreground font-medium hover:underline">New Order</Link>
              </div>
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No orders yet. Time for a coffee!</p>
                ) : (
                  orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex justify-between items-center p-3 bg-background rounded-lg border border-border">
                      <div>
                        <p className="text-sm font-bold text-foreground">Order #{order.id.slice(0,6)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">${order.totalPrice.toFixed(2)}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          {getStatusIcon(order.status)}
                          <span className="text-xs text-muted-foreground capitalize">{order.status}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reservations */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Calendar size={20} />
                  Reservations
                </h3>
                <Link to="/reserve" className="text-sm text-foreground font-medium hover:underline">Book Seat</Link>
              </div>
              <div className="space-y-4">
                {reservations.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No upcoming reservations.</p>
                ) : (
                  reservations.slice(0, 5).map(res => (
                    <div key={res.id} className="flex justify-between items-center p-3 bg-background rounded-lg border border-border">
                      <div>
                        <p className="text-sm font-bold text-foreground">{new Date(res.date).toLocaleDateString()} at {res.time}</p>
                        <p className="text-xs text-muted-foreground">{res.seatType}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(res.status)}
                        <span className="text-xs text-muted-foreground capitalize">{res.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Users size={20} />
                  My Events
                </h3>
                <Link to="/community/events" className="text-sm text-foreground font-medium hover:underline">Browse</Link>
              </div>
              <div className="space-y-4">
                {events.length === 0 ? (
                  <p className="text-muted-foreground text-sm">You haven't registered for any events.</p>
                ) : (
                  events.map(event => (
                    <div key={event.id} className="p-3 bg-background rounded-lg border border-border">
                      <p className="text-sm font-bold text-foreground truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(event.date).toLocaleDateString()} • {event.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;