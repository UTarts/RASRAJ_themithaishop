import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { LayoutDashboard, Package, Grid3X3, ClipboardList, LogOut, Menu, X, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const STATUSES = ['placed', 'accepted', 'preparing', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  placed: 'bg-blue-100 text-blue-700', accepted: 'bg-green-100 text-green-700',
  preparing: 'bg-yellow-100 text-yellow-700', packed: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700', delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700'
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { authHeaders, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: t('adminDashboard') },
    { path: '/admin/products', icon: Package, label: t('adminProducts') },
    { path: '/admin/categories', icon: Grid3X3, label: t('adminCategories') },
    { path: '/admin/orders', icon: ClipboardList, label: t('adminOrders') },
  ];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [ordRes, partRes] = await Promise.all([
        axios.get(`${API}/orders`, { headers: authHeaders() }),
        axios.get(`${API}/admin/delivery-partners`, { headers: authHeaders() }),
      ]);
      setOrders(ordRes.data);
      setPartners(partRes.data);
    } catch (e) { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  };

  const updateStatus = async (ordId, status, deliveryPartnerId = null) => {
    try {
      await axios.put(`${API}/orders/${ordId}/status`, { status, delivery_partner_id: deliveryPartnerId }, { headers: authHeaders() });
      toast.success(`Status updated to ${status}`);
      fetchData();
    } catch (e) { toast.error("Failed to update status"); }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const Sidebar = () => (
    <div className="h-full admin-sidebar p-4 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="text-white"><div className="font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>RAS RAJ</div><div className="text-white/60 text-xs">Admin Panel</div></div>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/60"><X className="h-5 w-5" /></button>
      </div>
      <nav className="space-y-1 flex-1">
        {navItems.map(item => (
          <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname === item.path ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <item.icon className="h-4 w-4" /> {item.label}
          </Link>
        ))}
      </nav>
      <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 text-white/70 hover:text-white text-sm px-3 py-2">
        <LogOut className="h-4 w-4" /> {t('logout')}
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FFF6E5]">
      <div className="hidden md:block w-56 shrink-0"><Sidebar /></div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-56"><Sidebar /></div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#E6D5BC] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-[#F5E6D3]"><Menu className="h-5 w-5 text-[#9B111E]" /></button>
            <h1 className="text-lg font-bold text-[#2A2A2A]" style={{ fontFamily: 'Playfair Display, serif' }}>{t('adminOrders')}</h1>
          </div>
          <button onClick={fetchData} className="p-2 hover:bg-[#F5E6D3] rounded-full text-[#9B111E]"><RefreshCw className="h-4 w-4" /></button>
        </div>
        <div className="p-4 md:p-6">
          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-4">
            {['all', ...STATUSES].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all capitalize ${filter === s ? 'bg-[#9B111E] text-white border-[#9B111E]' : 'bg-white text-[#2A2A2A] border-[#E6D5BC] hover:border-[#D4AF37]'}`}>
                {s === 'all' ? `All (${orders.length})` : s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 rounded-full border-4 border-[#D4AF37] border-t-transparent" /></div>
          ) : (
            <div className="space-y-3" data-testid="admin-orders-list">
              {filtered.map(order => (
                <div key={order.id} className="bg-white rounded-xl border border-[#E6D5BC] p-4" data-testid={`admin-order-${order.id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-bold text-[#9B111E] font-mono text-sm">#{order.order_number}</p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString('en-IN')}</p>
                      <p className="text-sm font-medium text-[#2A2A2A]">{order.user_name} · {order.user_phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                      <span className="font-bold text-[#9B111E] text-sm">₹{order.total}</span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <p className="text-xs text-gray-500 mb-3">{order.items?.length} items · {order.payment_method?.toUpperCase()} · {order.delivery_type}</p>

                  {/* Status Update */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-semibold text-gray-500">Update:</span>
                    {STATUSES.filter(s => s !== order.status && s !== 'placed').map(s => (
                      <button key={s} onClick={() => updateStatus(order.id, s)}
                        className={`text-xs px-2 py-1 rounded-full border font-medium transition-all hover:scale-105 ${STATUS_COLORS[s]?.replace('bg-', 'border-').replace('-100', '-300') || ''} ${STATUS_COLORS[s]}`}
                        data-testid={`update-status-${order.id}-${s}`}>
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Assign Delivery Partner */}
                  {['packed', 'out_for_delivery'].includes(order.status) && partners.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">Assign:</span>
                      <select className="text-xs border border-[#E6D5BC] rounded px-2 py-1" onChange={e => e.target.value && updateStatus(order.id, 'out_for_delivery', e.target.value)}>
                        <option value="">Select delivery partner</option>
                        {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              ))}
              {filtered.length === 0 && <p className="text-center py-8 text-gray-400">No orders found</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
