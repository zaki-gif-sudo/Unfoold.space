import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { Calendar, Clock, Users, CheckCircle, Info, ArrowRight, Coffee, Laptop, MessageSquare, AlertTriangle } from 'lucide-react';
import { withRetry } from '@/utils/apiErrorHandler.js';

const SEAT_TYPES = [
  { id: 'Bar Seat', name: 'Bar Seat', icon: Coffee, desc: 'Front row view of our baristas at work. Perfect for solo visits.', capacity: 10 },
  { id: 'Social Table', name: 'Social Table', icon: MessageSquare, desc: 'Communal seating designed for conversation and meeting new people.', capacity: 20 },
  { id: 'Work Desk', name: 'Work Desk', icon: Laptop, desc: 'Quiet zone with power outlets. Ideal for deep focus.', capacity: 15 }
];

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
  "09:00 PM", "09:30 PM"
];

const ReservationPage = () => {
  const { currentUser } = useAuth();
  
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seatType, setSeatType] = useState('Bar Seat');
  const [guests, setGuests] = useState(1);
  const [requests, setRequests] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [error, setError] = useState(null);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  useEffect(() => {
    const checkAvailability = async () => {
      if (!date || !time || !seatType) {
        setAvailability(null);
        return;
      }

      if (!navigator.onLine) {
        setAvailability(SEAT_TYPES.find(s => s.id === seatType).capacity);
        return;
      }

      setCheckingAvailability(true);
      setError(null);
      try {
        const records = await withRetry(() => pb.collection('reservations').getList(1, 100, {
          filter: `date="${date}" && time="${time}" && seatType="${seatType}" && status!="cancelled"`,
          $autoCancel: false
        }));

        const bookedSeats = records.items.reduce((total, res) => total + (res.numberOfGuests || 1), 0);
        const seatInfo = SEAT_TYPES.find(s => s.id === seatType);
        const available = Math.max(0, seatInfo.capacity - bookedSeats);
        
        setAvailability(available);
      } catch (err) {
        console.error("Error checking availability:", err);
        setError(err.userMessage || "Failed to check availability.");
      } finally {
        setCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [date, time, seatType]);

  // Sync offline reservations
  useEffect(() => {
    const handleOnline = async () => {
      const offlineRes = JSON.parse(localStorage.getItem('offlineReservations') || '[]');
      if (offlineRes.length > 0 && currentUser) {
        try {
          for (const res of offlineRes) {
            await withRetry(() => pb.collection('reservations').create(res, { $autoCancel: false }));
          }
          localStorage.removeItem('offlineReservations');
          window.dispatchEvent(new Event('offlineActionQueued'));
          alert("Your offline reservations have been synced successfully!");
        } catch (err) {
          console.error("Failed to sync offline reservations", err);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (availability !== null && guests > availability && navigator.onLine) {
      alert(`Sorry, only ${availability} seats available for this selection.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const dateStr = date.replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const bookingRef = `UNFOOLD-${dateStr}-${randomStr}`;

    const reservationData = {
      userId: currentUser.id,
      date: date,
      time: time,
      seatType: seatType,
      numberOfGuests: parseInt(guests),
      specialRequests: requests,
      status: 'pending',
      bookingReference: bookingRef
    };

    if (!navigator.onLine) {
      const offlineRes = JSON.parse(localStorage.getItem('offlineReservations') || '[]');
      offlineRes.push(reservationData);
      localStorage.setItem('offlineReservations', JSON.stringify(offlineRes));
      window.dispatchEvent(new Event('offlineActionQueued'));
      
      setConfirmedBooking(reservationData);
      window.scrollTo(0, 0);
      setIsSubmitting(false);
      alert("You are offline. Reservation saved locally and will sync when online.");
      return;
    }

    try {
      const record = await withRetry(() => pb.collection('reservations').create(reservationData, { $autoCancel: false }));
      setConfirmedBooking(record);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error("Reservation failed:", err);
      setError(err.userMessage || "Failed to make reservation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 flex items-center justify-center">
        <Helmet><title>Booking Confirmed | Unfoold Espresso</title></Helmet>
        <div className="max-w-lg w-full bg-card rounded-2xl shadow-md border border-border p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Reservation Confirmed</h1>
          <p className="text-muted-foreground mb-8">We look forward to hosting you at Unfoold.</p>

          <div className="bg-background rounded-xl p-6 mb-8 text-left border border-border space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono font-bold text-foreground">{confirmedBooking.bookingReference}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border pb-4">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="font-medium text-foreground">{new Date(confirmedBooking.date).toLocaleDateString()} at {confirmedBooking.time}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border pb-4">
              <span className="text-muted-foreground">Seat Type</span>
              <span className="font-medium text-foreground">{confirmedBooking.seatType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Guests</span>
              <span className="font-medium text-foreground">{confirmedBooking.numberOfGuests} Person(s)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/dashboard" className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              View Dashboard <ArrowRight size={18} />
            </Link>
            <button onClick={() => { setConfirmedBooking(null); setDate(''); setTime(''); setRequests(''); }} className="flex-1 py-3 bg-background text-foreground border border-border rounded-md hover:border-foreground transition-colors">
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <Helmet>
        <title>Reserve a Seat | Unfoold Espresso</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Reserve Your Space</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Secure your spot for work, conversation, or simply enjoying a quiet moment with exceptional coffee.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3 text-destructive">
            <AlertTriangle size={20} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-8 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Date & Time Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Calendar size={18} /> Select Date
                  </label>
                  <input 
                    type="date" 
                    required
                    min={minDate}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Clock size={18} /> Select Time
                  </label>
                  <select 
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground transition-colors appearance-none"
                  >
                    <option value="" disabled>Choose a time slot</option>
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Seat Type Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                  <Users size={18} /> Choose Experience
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SEAT_TYPES.map(type => {
                    const Icon = type.icon;
                    const isSelected = seatType === type.id;
                    return (
                      <div 
                        key={type.id}
                        onClick={() => setSeatType(type.id)}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                          isSelected 
                            ? 'border-foreground bg-muted' 
                            : 'border-border bg-background hover:border-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-foreground text-background' : 'bg-muted text-foreground'}`}>
                            <Icon size={20} />
                          </div>
                          <h3 className={`font-bold ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>{type.name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{type.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Guests & Availability */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Number of Guests</label>
                  <input 
                    type="number" 
                    min="1"
                    max="10"
                    required
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground transition-colors"
                  />
                </div>
                
                <div className="h-[52px] flex items-center">
                  {checkingAvailability ? (
                    <div className="text-sm text-muted-foreground flex items-center gap-2 animate-pulse">
                      <Clock size={16} /> Checking availability...
                    </div>
                  ) : availability !== null ? (
                    <div className={`text-sm flex items-center gap-2 px-4 py-2 rounded-lg border ${
                      availability >= guests 
                        ? 'bg-muted border-border text-foreground' 
                        : 'bg-destructive/10 border-destructive/30 text-destructive'
                    }`}>
                      {availability >= guests ? <CheckCircle size={16} /> : <Info size={16} />}
                      {availability >= guests 
                        ? `${availability} seats available for this time.` 
                        : `Only ${availability} seats left. Please adjust guests or time.`}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Info size={16} /> Select date and time to check availability
                    </div>
                  )}
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Special Requests (Optional)</label>
                <textarea 
                  rows="3"
                  value={requests}
                  onChange={(e) => setRequests(e.target.value)}
                  placeholder="Any dietary requirements or specific seating preferences?"
                  className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground transition-colors resize-none"
                ></textarea>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-border">
                <button 
                  type="submit"
                  disabled={isSubmitting || (availability !== null && guests > availability && navigator.onLine)}
                  className="w-full py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
                >
                  {isSubmitting ? 'Processing Reservation...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;