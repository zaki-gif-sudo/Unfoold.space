import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { CheckCircle, Coffee, ArrowRight } from 'lucide-react';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  useEffect(() => {
    if (!order) {
      navigate('/menu');
    }
  }, [order, navigate]);

  if (!order) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <Helmet>
        <title>Order Confirmed | Unfoold Espresso</title>
      </Helmet>

      <div className="max-w-md w-full bg-card rounded-2xl shadow-2xl border border-border p-8 text-center">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-8">Your coffee is being prepared with care.</p>

        <div className="bg-secondary rounded-xl p-6 mb-8 text-left border border-border/50">
          <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
            <span className="text-muted-foreground">Order Number</span>
            <span className="font-mono font-bold text-foreground">#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
            <span className="text-muted-foreground">Pickup Time</span>
            <span className="font-bold text-primary">{order.pickupTime}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Paid</span>
            <span className="font-bold text-foreground">${order.totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <Link 
            to="/dashboard" 
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 transition-colors"
          >
            View in Dashboard <ArrowRight size={18} />
          </Link>
          <Link 
            to="/menu" 
            className="w-full flex items-center justify-center gap-2 py-3 bg-transparent text-foreground border border-border rounded-md hover:border-primary transition-colors"
          >
            <Coffee size={18} /> Order More
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;