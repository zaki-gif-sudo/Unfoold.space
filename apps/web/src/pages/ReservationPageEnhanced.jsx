import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import pb from '../lib/pocketbaseClient.js';
import { Calendar, Clock, Users, CheckCircle, Info, AlertTriangle, MapPin, Cigarette, Wind, Home } from 'lucide-react';
import { useToast } from '../hooks/use-toast.js';

const ZONE_CONFIG = {
  smoking_indoor: { label: 'Smoking Indoor', icon: Cigarette, color: 'amber', pax: 20 },
  smoking_outdoor: { label: 'Smoking Outdoor', icon: Wind, color: 'emerald', pax: 30 },
  indoor: { label: 'Indoor (Non-Smoking)', icon: Home, color: 'blue', pax: 20 },
};

const SeatButton = ({ table, selected, onClick }) => {
  const isAvailable = table.status === 'available';
  const isSelected = selected?.id === table.id;

  let classes = 'w-14 h-14 md:w-16 md:h-16 rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all duration-200 border-2 ';
  if (isSelected) {
    classes += 'bg-primary text-primary-foreground border-primary scale-110 shadow-lg shadow-primary/30';
  } else if (!isAvailable) {
    classes += 'bg-red-500/20 text-red-400 border-red-300 cursor-not-allowed opacity-60';
  } else {
    classes += 'bg-background text-foreground border-border hover:border-primary hover:bg-primary/10 cursor-pointer hover:scale-105';
  }

  return (
    <button
      onClick={() => isAvailable && onClick(table)}
      disabled={!isAvailable}
      className={classes}
      title={`${table.table_number} - ${table.capacity} kursi${!isAvailable ? ' (Terisi)' : ''}`}
    >
      <span className="text-[10px] md:text-xs leading-tight">{table.table_number.split('-')[1]}</span>
      <span className="text-[9px] md:text-[10px] opacity-70">{table.capacity}p</span>
    </button>
  );
};

const ZoneMap = ({ zone, tables, selectedTable, onSelectTable }) => {
  const config = ZONE_CONFIG[zone];
  if (!config) return null;
  const Icon = config.icon;
  const zoneTables = tables.filter(t => t.area === zone);
  const available = zoneTables.filter(t => t.status === 'available').length;
  const total = zoneTables.length;
  const totalPax = zoneTables.reduce((sum, t) => sum + (t.status === 'available' ? t.capacity : 0), 0);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-${config.color}-500/10 border border-${config.color}-200`}>
            <Icon size={18} className={`text-${config.color}-600`} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm md:text-base">{config.label}</h3>
            <p className="text-[11px] md:text-xs text-muted-foreground">Kapasitas: {config.pax} pax</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${available > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {available}/{total} meja
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground">{totalPax} kursi tersedia</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 md:gap-3 justify-center py-3 px-2 bg-muted/50 rounded-xl border border-border/50 min-h-[80px]">
        {zoneTables.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Tidak ada meja</p>
        ) : (
          zoneTables.map(table => (
            <SeatButton
              key={table.id}
              table={table}
              selected={selectedTable}
              onClick={onSelectTable}
            />
          ))
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] md:text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-background border-2 border-border inline-block"></span> Tersedia</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary inline-block"></span> Dipilih</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/20 border border-red-300 inline-block"></span> Terisi</span>
      </div>
    </div>
  );
};

const ReservationPageEnhanced = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const today = new Date().toISOString().split('T')[0];
  const [date] = useState(today);
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState(1);
  const [selectedTable, setSelectedTable] = useState(null);
  const [requests, setRequests] = useState('');

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const TIME_SLOTS = Array.from({ length: 27 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const minute = (i % 2) * 30;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  });

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const records = await pb.collection('tables').getList(1, 100, {
        sort: 'area,table_number',
        $autoCancel: false,
      });
      setTables(records.items);
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();

    // Realtime subscription for live updates
    let unsub;
    pb.collection('tables').subscribe('*', () => {
      fetchTables();
    }, { $autoCancel: false }).then(u => { unsub = u; });

    return () => {
      pb.collection('tables').unsubscribe('*');
    };
  }, [fetchTables]);

  const handleSelectTable = (table) => {
    if (table.capacity < guests) {
      toast({ title: 'Kapasitas tidak cukup', description: `Meja ini hanya ${table.capacity} kursi, kamu butuh ${guests}`, variant: 'destructive' });
      return;
    }
    setSelectedTable(prev => prev?.id === table.id ? null : table);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time || !selectedTable || !currentUser) {
      toast({ title: 'Error', description: 'Lengkapi semua field dan pilih meja', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const reservation = await pb.collection('reservations').create({
        userId: currentUser.id,
        customerName: currentUser.name || currentUser.email || 'Customer',
        customerEmail: currentUser.email || '',
        date: date,
        time: time,
        numberOfGuests: parseInt(guests),
        seatType: ZONE_CONFIG[selectedTable.area]?.label || selectedTable.area,
        table_id: selectedTable.id,
        specialRequests: requests,
        bookingReference: 'UNFOOLD-' + date.replace(/-/g, '') + '-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        status: 'pending',
      });

      setConfirmedBooking({
        id: reservation.id,
        table: selectedTable.table_number,
        date, time, guests,
        area: ZONE_CONFIG[selectedTable.area]?.label || selectedTable.area,
      });

      toast({ title: 'Sukses!', description: 'Reservasi terkirim, menunggu konfirmasi kasir' });
      alert('Reservasi Anda telah berhasil dikirim! ✅\n\nMenunggu konfirmasi dari kasir.\nSilakan cek status reservasi di Dashboard Anda.');
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      console.error('Reservation error:', err);
      toast({ title: 'Gagal', description: err?.message || 'Gagal membuat reservasi', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <Helmet><title>Reservasi Terkirim | Unfoold</title></Helmet>
        <div className="max-w-md w-full bg-card rounded-2xl shadow-2xl border border-border p-8 text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Reservasi Terkirim!</h1>
          <p className="text-muted-foreground mb-8">Menunggu konfirmasi dari kasir. Silakan cek status di dashboard.</p>
          <div className="bg-secondary rounded-xl p-6 mb-8 text-left border border-border/50 space-y-4">
            {[
              ['Booking ID', '#' + confirmedBooking.id.slice(0, 8).toUpperCase()],
              ['Meja', confirmedBooking.table],
              ['Area', confirmedBooking.area],
              ['Tanggal & Waktu', `${confirmedBooking.date} ${confirmedBooking.time}`],
              ['Jumlah Tamu', `${confirmedBooking.guests} orang`],
            ].map(([label, value], i) => (
              <div key={i} className="flex justify-between items-center border-b border-border pb-3 last:border-0 last:pb-0">
                <span className="text-muted-foreground text-sm">{label}</span>
                <span className="font-bold text-sm">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Redirecting ke dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4">
      <Helmet><title>Reservasi Meja | Unfoold Coffee & Events</title></Helmet>

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Reservasi Meja</h1>
          <p className="text-muted-foreground">Pilih meja favorit Anda — seperti pesan kursi bioskop</p>
        </div>

        {/* Date/Time/Guests Form */}
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                <Calendar size={14} className="inline mr-1.5" />Tanggal
              </label>
              <div className="w-full px-3 py-2 border border-border rounded-lg bg-secondary text-foreground font-medium">
                {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Reservasi hanya untuk hari ini</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                <Clock size={14} className="inline mr-1.5" />Waktu
              </label>
              <select value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" required>
                <option value="">Pilih waktu...</option>
                {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                <Users size={14} className="inline mr-1.5" />Jumlah Tamu
              </label>
              <input type="number" value={guests} onChange={(e) => setGuests(parseInt(e.target.value) || 1)} min="1" max="30"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
          </div>
        </div>

        {/* Seat Map */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {Object.keys(ZONE_CONFIG).map(zone => (
              <ZoneMap
                key={zone}
                zone={zone}
                tables={tables}
                selectedTable={selectedTable}
                onSelectTable={handleSelectTable}
              />
            ))}
          </div>
        )}

        {/* Selected Table + Submit */}
        {selectedTable && (
          <div className="mt-6 bg-card border-2 border-primary rounded-2xl p-5 md:p-6 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-foreground text-lg">Meja Dipilih: {selectedTable.table_number}</h3>
                <p className="text-sm text-muted-foreground">
                  {ZONE_CONFIG[selectedTable.area]?.label} • Kapasitas {selectedTable.capacity} orang
                </p>
              </div>
              <button onClick={() => setSelectedTable(null)} className="text-sm text-muted-foreground hover:text-foreground underline">
                Ganti meja
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Permintaan Khusus (opsional)</label>
              <textarea value={requests} onChange={(e) => setRequests(e.target.value)}
                placeholder="Contoh: dekat jendela, kursi bayi..."
                rows="2"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm" />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !date || !time}
              className="w-full mt-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition text-base">
              {submitting ? 'Memproses...' : 'Konfirmasi Reservasi'}
            </button>
          </div>
        )}

        {!selectedTable && !loading && (
          <div className="mt-6 text-center text-muted-foreground text-sm">
            <Info size={20} className="inline mr-2" />
            Pilih meja pada peta di atas untuk melanjutkan reservasi
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationPageEnhanced;
