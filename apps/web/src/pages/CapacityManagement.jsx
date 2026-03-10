import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import pb from '../lib/pocketbaseClient';
import { Users, Plus, Edit2, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

const CapacityManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    table_number: '',
    area: 'indoor',
    capacity: 4,
    status: 'available'
  });

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 10000); // Refresh setiap 10 detik
    return () => clearInterval(interval);
  }, []);

  const fetchTables = async () => {
    try {
      const records = await pb.collection('tables').getList(1, 100, {
        sort: 'table_number',
      });
      setTables(records.items);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await pb.collection('tables').update(editingTable.id, formData);
      } else {
        await pb.collection('tables').create(formData);
      }
      resetForm();
      fetchTables();
    } catch (error) {
      console.error('Error saving table:', error);
    }
  };

  const handleDelete = async (tableId) => {
    if (window.confirm('Hapus table ini?')) {
      try {
        await pb.collection('tables').delete(tableId);
        fetchTables();
      } catch (error) {
        console.error('Error deleting table:', error);
      }
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number,
      area: table.area,
      capacity: table.capacity,
      status: table.status
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTable(null);
    setFormData({
      table_number: '',
      area: 'indoor',
      capacity: 4,
      status: 'available'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-500/20 text-green-700 border-green-200';
      case 'occupied': return 'bg-red-500/20 text-red-700 border-red-200';
      case 'reserved': return 'bg-yellow-500/20 text-yellow-700 border-yellow-200';
      case 'maintenance': return 'bg-gray-500/20 text-gray-700 border-gray-200';
      default: return 'bg-gray-500/20';
    }
  };

  const areaStats = {
    indoor: tables.filter(t => t.area === 'indoor').length,
    outdoor: tables.filter(t => t.area === 'outdoor').length,
    vip: tables.filter(t => t.area === 'vip').length,
    bar: tables.filter(t => t.area === 'bar').length
  };

  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const reservedCount = tables.filter(t => t.status === 'reserved').length;

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
        <title>Capacity Management | Unfoold</title>
      </Helmet>

      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Manajemen Kapasitas</h1>
              <p className="text-sm text-muted-foreground mt-1">Kelola meja dan kapasitas tempat</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
            >
              <Plus size={20} />
              Tambah Meja
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-500/10 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Total Kapasitas</p>
              <p className="text-2xl font-bold text-blue-700">{totalCapacity} orang</p>
            </div>
            <div className="bg-red-500/10 border border-red-200 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Terisi Sekarang</p>
              <p className="text-2xl font-bold text-red-700">{occupiedCount}</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-200 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Tereservasi</p>
              <p className="text-2xl font-bold text-yellow-700">{reservedCount}</p>
            </div>
            <div className="bg-green-500/10 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Tersedia</p>
              <p className="text-2xl font-bold text-green-700">{tables.filter(t => t.status === 'available').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8 shadow-md">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {editingTable ? 'Edit Meja' : 'Tambah Meja Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nomor Meja</label>
                  <input
                    type="text"
                    value={formData.table_number}
                    onChange={(e) => setFormData({...formData, table_number: e.target.value})}
                    placeholder="Contoh: T-01, Table A, VIP-1"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Area</label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="vip">VIP</option>
                    <option value="bar">Bar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Kapasitas Orang</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    min="1"
                    max="20"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium"
                >
                  {editingTable ? 'Update Meja' : 'Tambah Meja'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-secondary transition font-medium"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Area Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm font-medium text-muted-foreground">Indoor</p>
            <p className="text-2xl font-bold text-foreground">{areaStats.indoor}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm font-medium text-muted-foreground">Outdoor</p>
            <p className="text-2xl font-bold text-foreground">{areaStats.outdoor}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm font-medium text-muted-foreground">VIP</p>
            <p className="text-2xl font-bold text-foreground">{areaStats.vip}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm font-medium text-muted-foreground">Bar</p>
            <p className="text-2xl font-bold text-foreground">{areaStats.bar}</p>
          </div>
        </div>

        {/* Tables Grid */}
        {tables.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">Belum ada meja. Tambahkan meja baru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                className={`border-2 rounded-lg p-4 transition ${
                  table.status === 'available'
                    ? 'border-green-500 bg-green-500/5'
                    : table.status === 'occupied'
                    ? 'border-red-500 bg-red-500/5'
                    : table.status === 'reserved'
                    ? 'border-yellow-500 bg-yellow-500/5'
                    : 'border-gray-500 bg-gray-500/5'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{table.table_number}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{table.area}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(table.status)}`}>
                    {table.status}
                  </span>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Users size={16} />
                    <span>Kapasitas: {table.capacity} orang</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(table)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(table.id)}
                    className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <Trash2 size={14} />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CapacityManagement;
