import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { LayoutDashboard, Package, Grid3X3, ClipboardList, Users, LogOut, Menu, X, TrendingUp, ShoppingBag, Star, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function StatCard({ label, value, icon: Icon, color = '#9B111E', sub }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-[#E6D5BC] flex items-center gap-4">
      <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#2A2A2A]" data-testid={`stat-${label.toLowerCase().replace(/\s/g,'-')}`}>{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
        {sub && <p className="text-xs text-green-600 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { authHeaders, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const r = await axios.get(`${API}/admin/dashboard`, { headers: authHeaders() });
      setStats(r.data);
    } catch (e) { toast.error("Failed to load dashboard"); }
    finally { setLoading(false); }
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: t('adminDashboard') },
    { path: '/admin/products', icon: Package, label: t('adminProducts') },
    { path: '/admin/categories', icon: Grid3X3, label: t('adminCategories') },
    { path: '/admin/orders', icon: ClipboardList, label: t('adminOrders') },
  ];

  const STATUS_COLORS = {
    placed: 'bg-blue-100 text-blue-700', accepted: 'bg-green-100 text-green-700',
    preparing: 'bg-yellow-100 text-yellow-700', packed: 'bg-purple-100 text-purple-700',
    out_for_delivery: 'bg-orange-100 text-orange-700', delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-700'
  };

  const Sidebar = () => (
    <div className="h-full admin-sidebar p-4 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="text-white">
          <div className="font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>RAS RAJ</div>
          <div className="text-white/60 text-xs">Admin Panel</div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/60"><X className="h-5 w-5" /></button>
      </div>
      <nav className="space-y-1 flex-1">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname === item.path ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
          >
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
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-56 shrink-0"><Sidebar /></div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-56"><Sidebar /></div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div className="sticky top-0 bg-white border-b border-[#E6D5BC] px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-[#F5E6D3]">
            <Menu className="h-5 w-5 text-[#9B111E]" />
          </button>
          <h1 className="text-lg font-bold text-[#2A2A2A]" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('adminDashboard')}
          </h1>
        </div>

        <div className="p-4 md:p-6">
          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 rounded-full border-4 border-[#D4AF37] border-t-transparent" /></div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" data-testid="dashboard-stats">
                <StatCard label={t('todayOrders')} value={stats?.today_orders || 0} icon={ShoppingBag} color="#9B111E" />
                <StatCard label="Today Revenue" value={`₹${stats?.today_revenue || 0}`} icon={TrendingUp} color="#D4AF37" />
                <StatCard label={t('totalRevenue')} value={`₹${stats?.total_revenue || 0}`} icon={TrendingUp} color="#B8962E" />
                <StatCard label={t('totalUsers')} value={stats?.total_users || 0} icon={Users} color="#7A0C16" />
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-xl border border-[#E6D5BC] mb-6" data-testid="recent-orders">
                <div className="p-4 border-b border-[#E6D5BC] flex items-center justify-between">
                  <h2 className="font-bold text-[#2A2A2A]">Recent Orders</h2>
                  <Link to="/admin/orders" className="text-[#9B111E] text-sm font-semibold hover:underline">View All</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F5E6D3]">
                      <tr>
                        <th className="text-left px-4 py-2 font-semibold text-[#2A2A2A]">Order #</th>
                        <th className="text-left px-4 py-2 font-semibold text-[#2A2A2A]">Customer</th>
                        <th className="text-left px-4 py-2 font-semibold text-[#2A2A2A]">Total</th>
                        <th className="text-left px-4 py-2 font-semibold text-[#2A2A2A]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.recent_orders?.map(order => (
                        <tr key={order.id} className="border-t border-[#E6D5BC] hover:bg-[#FFF6E5]">
                          <td className="px-4 py-3 font-mono text-xs font-bold text-[#9B111E]">{order.order_number}</td>
                          <td className="px-4 py-3 text-[#2A2A2A]">{order.user_name}</td>
                          <td className="px-4 py-3 font-bold">₹{order.total}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Low Stock */}
              {stats?.low_stock?.length > 0 && (
                <div className="bg-red-50 rounded-xl border border-red-200 p-4" data-testid="low-stock">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h2 className="font-bold text-red-800">Out of Stock Items</h2>
                  </div>
                  <div className="space-y-2">
                    {stats.low_stock.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-red-700">{p.name}</span>
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">Out of Stock</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
