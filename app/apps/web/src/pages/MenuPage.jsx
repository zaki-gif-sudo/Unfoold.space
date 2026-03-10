import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { ShoppingCart, Plus, Minus, X, Coffee, AlertTriangle, RefreshCw } from 'lucide-react';
import { withRetry } from '@/utils/apiErrorHandler.js';

const MenuSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="bg-card rounded-xl border border-border p-6 flex flex-col justify-between animate-pulse">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="h-6 bg-muted rounded w-2/3"></div>
            <div className="h-6 bg-muted rounded w-1/4"></div>
          </div>
          <div className="h-4 bg-muted rounded w-full mb-2"></div>
          <div className="h-4 bg-muted rounded w-4/5 mb-6"></div>
        </div>
        <div className="h-10 bg-muted rounded w-full"></div>
      </div>
    ))}
  </div>
);

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [pickupTime, setPickupTime] = useState('ASAP');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const fetchMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await withRetry(() => pb.collection('menuItems').getFullList({
        sort: 'category,name',
        $autoCancel: false
      }));
      setMenuItems(records);
      
      const uniqueCategories = ['All', ...new Set(records.map(item => item.category))];
      setCategories(uniqueCategories);
      
      // Cache for offline use
      localStorage.setItem('cachedMenu', JSON.stringify(records));
    } catch (err) {
      console.error("Error fetching menu:", err);
      setError(err.userMessage || "Failed to load menu.");
      
      // Fallback to cache
      const cached = localStorage.getItem('cachedMenu');
      if (cached) {
        const parsed = JSON.parse(cached);
        setMenuItems(parsed);
        setCategories(['All', ...new Set(parsed.map(item => item.category))]);
        setError("You are offline. Showing cached menu.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Sync offline orders when coming back online
  useEffect(() => {
    const handleOnline = async () => {
      const offlineOrders = JSON.parse(localStorage.getItem('offlineOrders') || '[]');
      if (offlineOrders.length > 0 && currentUser) {
        try {
          for (const order of offlineOrders) {
            await withRetry(() => pb.collection('orders').create(order, { $autoCancel: false }));
          }
          localStorage.removeItem('offlineOrders');
          window.dispatchEvent(new Event('offlineActionQueued'));
          alert("Your offline orders have been synced successfully!");
        } catch (err) {
          console.error("Failed to sync offline orders", err);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [currentUser]);

  const addToCart = (item) => {
    const cartItem = {
      id: Date.now().toString(),
      menuItemId: item.id,
      name: item.name,
      price: item.basePrice,
      quantity: 1,
      customization: { size: 'Medium', milk: 'Whole', temp: 'Hot' }
    };
    setCart([...cart, cartItem]);
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(item => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId, delta) => {
    setCart(cart.map(item => {
      if (item.id === cartItemId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!currentUser) {
      navigate('/login', { state: { from: { pathname: '/menu' } } });
      return;
    }

    if (cart.length === 0) return;

    setIsCheckingOut(true);
    const orderData = {
      userId: currentUser.id,
      items: cart,
      totalPrice: cartTotal,
      pickupTime: pickupTime,
      status: 'pending'
    };

    if (!navigator.onLine) {
      const offlineOrders = JSON.parse(localStorage.getItem('offlineOrders') || '[]');
      offlineOrders.push(orderData);
      localStorage.setItem('offlineOrders', JSON.stringify(offlineOrders));
      window.dispatchEvent(new Event('offlineActionQueued'));
      
      alert("You are offline. Your order has been saved and will be placed automatically when you reconnect.");
      setCart([]);
      setIsCartOpen(false);
      setIsCheckingOut(false);
      return;
    }

    try {
      const record = await withRetry(() => pb.collection('orders').create(orderData, { $autoCancel: false }));
      setCart([]);
      setIsCartOpen(false);
      navigate('/order-confirmation', { state: { order: record } });
    } catch (err) {
      console.error("Checkout failed:", err);
      alert(err.userMessage || "Failed to place order. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const filteredItems = activeCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-background py-12 relative">
      <Helmet>
        <title>Menu | Unfoold Espresso</title>
      </Helmet>

      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Our Menu</h1>
            <p className="text-muted-foreground">Crafted with passion, poured with precision.</p>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-3 bg-card rounded-full text-foreground hover:bg-muted transition-colors border border-border shadow-sm"
          >
            <ShoppingCart size={24} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle size={20} />
              <p className="font-medium">{error}</p>
            </div>
            <button onClick={fetchMenu} className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md text-sm font-medium hover:bg-muted transition-colors border border-border">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Categories */}
        <div className="flex overflow-x-auto pb-4 mb-8 gap-2 scrollbar-hide">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors border ${
                activeCategory === category 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background text-foreground border-border hover:border-foreground'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        {loading ? (
          <MenuSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-card rounded-xl border border-border p-6 flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-foreground">{item.name}</h3>
                    <span className="text-foreground font-bold">${item.basePrice.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.description || 'A delicious coffee creation.'}</p>
                </div>
                <button 
                  onClick={() => addToCart(item)}
                  className="w-full py-2 bg-background text-foreground border border-border rounded-md hover:bg-foreground hover:text-background transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Add to Order
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Sidebar Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-card h-full shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <ShoppingCart size={24} /> Your Order
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                  <Coffee size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Your cart is empty.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center border-b border-border/50 pb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {item.customization.size} • {item.customization.milk} • {item.customization.temp}
                      </p>
                      <div className="text-foreground font-medium mt-1">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-3 bg-background rounded-lg p-1 border border-border">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-foreground hover:opacity-70"><Minus size={16} /></button>
                      <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-foreground hover:opacity-70"><Plus size={16} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="ml-4 text-muted-foreground hover:text-foreground">
                      <X size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-border bg-muted/30">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">Pickup Time</label>
                  <select 
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full bg-background border border-border text-foreground rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-foreground"
                  >
                    <option value="ASAP">ASAP (10-15 mins)</option>
                    <option value="15 min">In 15 minutes</option>
                    <option value="30 min">In 30 minutes</option>
                    <option value="1 hour">In 1 hour</option>
                  </select>
                </div>
                <div className="flex justify-between items-center mb-6 text-lg font-bold text-foreground">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isCheckingOut ? 'Processing...' : 'Checkout'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;