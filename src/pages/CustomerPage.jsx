import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Phone,
  CreditCard,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import useAuthStore from '../store/authStore';
import customerService from '../services/customerService';

const CustomerPage = () => {
  const { businessId } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', taxId: '', address: '', city: '', customerType: 'INDIVIDUAL'
  });

  const fetchCustomers = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const params = searchTerm ? { search: searchTerm } : {};
      const response = await customerService.getCustomers(businessId, params);
      const data = response.data;
      setCustomers(data.content || data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [businessId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (businessId) fetchCustomers();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customerService.updateCustomer(businessId, editingCustomer.id, formData);
      } else {
        await customerService.createCustomer(businessId, formData);
      }
      setShowModal(false);
      setEditingCustomer(null);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', taxId: '', address: '', city: '', customerType: 'INDIVIDUAL' });
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar cliente');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      taxId: customer.taxId || '',
      address: customer.address || '',
      city: customer.city || '',
      customerType: customer.customerType || 'INDIVIDUAL',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    try {
      await customerService.deleteCustomer(businessId, id);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar cliente');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Clientes</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gestiona tu base de datos de compradores y lealtad</p>
        </div>
        <Button className="h-fit" onClick={() => { setEditingCustomer(null); setFormData({ firstName: '', lastName: '', email: '', phone: '', taxId: '', address: '', city: '', customerType: 'INDIVIDUAL' }); setShowModal(true); }}>
          <UserPlus size={20} />
          <span>Nuevo Cliente</span>
        </Button>
      </div>

      <div className="glass-panel p-4 rounded-3xl flex items-center gap-4">
        <Input
          className="flex-1"
          placeholder="Buscar clientes por nombre, email o identificación..."
          icon={Search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-400" size={20} />
          <span className="text-red-400 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-white"><X size={16} /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="animate-spin text-primary-400" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <motion.div
              key={customer.id}
              whileHover={{ y: -4 }}
              className="glass-card p-6 rounded-3xl relative group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-primary-600/20 rounded-2xl flex items-center justify-center text-primary-400 font-bold text-xl">
                  {(customer.firstName || customer.fullName || 'C').charAt(0)}
                </div>
                <div>
                  <h4 className="text-slate-800 dark:text-white font-bold text-lg leading-tight">
                    {customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`}
                  </h4>
                  {customer.taxId && (
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                      <CreditCard size={12} />
                      <span>NIT/CC: {customer.taxId}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {customer.email && (
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm">
                    <Mail size={16} />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm">
                    <Phone size={16} />
                    <span>{customer.phone}</span>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Tipo</p>
                  <p className="text-slate-800 dark:text-white font-bold mt-0.5">{customer.customerType || 'Individual'}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(customer)} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:text-white transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(customer.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {customers.length === 0 && !loading && (
            <div className="col-span-full text-center py-16 text-slate-500">
              <Users size={48} className="mx-auto mb-4 opacity-40" />
              <p>No se encontraron clientes</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel rounded-3xl p-8 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nombre" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                <Input label="Apellido" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
              </div>
              <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Teléfono" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                <Input label="NIT/CC" value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} />
              </div>
              <Input label="Dirección" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              <Input label="Ciudad" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1">{editingCustomer ? 'Actualizar' : 'Crear Cliente'}</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CustomerPage;
