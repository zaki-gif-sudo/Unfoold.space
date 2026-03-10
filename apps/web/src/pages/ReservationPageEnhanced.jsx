import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import pb from '../lib/pocketbaseClient.js';
import { Calendar, Clock, Users, CheckCircle, Info, Coffee, AlertTriangle, MapPin } from 'lucide-react';
import { useToast } from '../hooks/use-toast.js';

const ReservationPageEnhanced = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState(1);
  const [selectedTable, setSelectedTable] = useState(null);
  const [requests, setRequests] = useState('');
  const [area, setArea] = useState('all');

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [error, setError] = useState(null);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const TIME_SLOTS = Array.from({ length: 27 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const minute = (i % 2) * 30;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchAvailableTables();
  }, [date, time, guests, area]);

  const fetchAvailableTables = async () => {
    if (!date || !time) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get all available tables
      let query = 'status = "available"';
      if (area !== 'all') {
        query += ` && area = "${area}"`;
      }

      const records = await pb.collection('tables').getList(1, 100, {
        filter: query,
        sort: 'capacity',
      });

      // Filter by capacity
      const suitable = records.items.filter(t => t.capacity >= guests);
      setTables(suitable);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!date || !time || !selectedTable || !currentUser) {
      toast({
        title: 'Error',
        description: 'Semua field harus diisi',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const reservation = await pb.collection('reservations').create({
        user_id: currentUser.id,
        date: date,
        time: time,
        number_of_guests: parseInt(guests),
        table_id: selectedTable.id,
        special_requests: requests,
        status: 'confirmed'
      });

      // Update table status to reserved
      await pb.collection('tables').update(selectedTable.id, {
        status: 'reserved',
        current_reservation: reservation.id
      });

      setConfirmedBooking({
        id: reservation.id,
        table: selectedTable.table_number,
        date: date,
        time: time,
        guests: guests,
        area: selectedTable.area
      });

      toast({
        title: 'Sukses!',
        description: 'Reservasi berhasil dibuat',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error creating reservation:', error);
      setError(error.message);
      toast({
        title: 'Error',
        description: 'Gagal membuat reservasi',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <Helmet>
          <title>Reservasi Dikonfirmasi | Unfoold</title>
        </Helmet>
        <div className="max-w-md w-full bg-card rounded-2xl shadow-2xl border border-border p-8 text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-primary" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">Reservasi Dikonfirmasi!</h1>
          <p className="text-muted-foreground mb-8">Terima kasih telah melakukan reservasi</p>

          <div className="bg-secondary rounded-xl p-6 mb-8 text-left border border-border/50 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <span className="text-muted-foreground">Booking ID</span>
              <span className="font-mono font-bold">#{confirmedBooking.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border pb-4">
              <span className="text-muted-foreground">Meja</span>
              <span className="font-bold text-primary">{confirmedBooking.table}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border pb-4">
              <span className="text-muted-foreground">Area</span>
              <span className="font-bold capitalize">{confirmedBooking.area}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border pb-4">
              <span className="text-muted-foreground">Tanggal & Waktu</span>
              <span className="font-bold">{confirmedBooking.date} {confirmedBooking.time}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Jumlah Tamu</span>
              <span className="font-bold">{confirmedBooking.guests} orang</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <Helmet>
        <title>Reservasi Meja | Unfoold Coffee & Events</title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Reservasi Meja</h1>
          <p className="text-muted-foreground">Pesan meja favorit Anda sekarang</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8 shadow-lg space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-semibold text-red-900">Error</p>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    <Calendar size={16} className="inline mr-2" />
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={minDate}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    <Clock size={16} className="inline mr-2" />
                    Waktu
                  </label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Pilih waktu...</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Guests & Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    <Users size={16} className="inline mr-2" />
                    Jumlah Tamu
                  </label>
                  <input
                    type="number"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    min="1"
                    max="20"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    <MapPin size={16} className="inline mr-2" />
                    Area Pilihan
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Semua Area</option>
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="vip">VIP</option>
                    <option value="bar">Bar</option>
                  </select>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">Permintaan Khusus</label>
                <textarea
                  value={requests}
                  onChange={(e) => setRequests(e.target.value)}
                  placeholder="Contoh: near window, away from noise, high chair for baby..."
                  rows="3"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedTable}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
              >
                {submitting ? 'Memproses...' : 'Konfirmasi Reservasi'}
              </button>
            </form>
          </div>

          {/* Available Tables */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-foreground mb-4">Meja Tersedia</h2>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : !date || !time ? (
              <div className="text-center py-8 text-muted-foreground">
                <Info size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Pilih tanggal dan waktu terlebih dahulu</p>
              </div>
            ) : tables.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Tidak ada meja tersedia untuk pilihan Anda</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className={`w-full p-4 rounded-lg border-2 transition text-left ${
                      selectedTable?.id === table.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-foreground">{table.table_number}</p>
                        <p className="text-xs text-muted-foreground capitalize">{table.area}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">
                          {table.capacity} <Users size={14} className="inline" />
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedTable && (
              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-foreground">
                  <strong>Meja Dipilih:</strong> {selectedTable.table_number}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Kapasitas: {selectedTable.capacity} orang</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPageEnhanced;
