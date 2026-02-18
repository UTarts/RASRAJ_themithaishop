import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Plus, Edit, Trash2, LayoutDashboard, Package, Grid3X3, ClipboardList, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EMPTY = { name: '', name_hi: '', slug: '', emoji: '', image: '', order: 0 };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState(EMPTY);
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

  useEffect(() => { fetchCats(); }, []);

  const fetchCats = async () => {
    try {
      const r = await axios.get(`${API}/categories`);
      setCategories(r.data);
    } catch (e) { toast.error("Failed to load categories"); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditCat(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (c) => { setEditCat(c); setForm({ name: c.name, name_hi: c.name_hi, slug: c.slug, emoji: c.emoji || '', image: c.image || '', order: c.order || 0 }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.slug) { toast.error("Name and slug required"); return; }
    try {
      if (editCat) {
        await axios.put(`${API}/categories/${editCat.id}`, form, { headers: authHeaders() });
        toast.success("Category updated!");
      } else {
        await axios.post(`${API}/categories`, form, { headers: authHeaders() });
        toast.success("Category added!");
      }
      setShowModal(false);
      fetchCats();
    } catch (e) { toast.error(e.response?.data?.detail || "Error saving category"); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await axios.delete(`${API}/categories/${id}`, { headers: authHeaders() });
      toast.success("Category deleted");
      fetchCats();
    } catch (e) { toast.error("Failed to delete"); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

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
            <h1 className="text-lg font-bold text-[#2A2A2A]" style={{ fontFamily: 'Playfair Display, serif' }}>{t('adminCategories')}</h1>
          </div>
          <button onClick={openAdd} className="btn-brand-primary text-sm flex items-center gap-1 px-4 py-2" data-testid="add-category-btn">
            <Plus className="h-4 w-4" /> Add Category
          </button>
        </div>
        <div className="p-4 md:p-6">
          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 rounded-full border-4 border-[#D4AF37] border-t-transparent" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" data-testid="categories-grid">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white rounded-xl border border-[#E6D5BC] p-4 flex items-center gap-4" data-testid={`category-card-${cat.id}`}>
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#E6D5BC] bg-[#F5E6D3] shrink-0">
                    {cat.image ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">{cat.emoji}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#2A2A2A] truncate">{cat.name}</p>
                    <p className="text-[#B8962E] text-xs truncate">{cat.name_hi}</p>
                    <p className="text-gray-400 text-xs font-mono">{cat.slug}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-[#F5E6D3] rounded-lg" data-testid={`edit-cat-${cat.id}`}><Edit className="h-4 w-4 text-[#B8962E]" /></button>
                    <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1.5 hover:bg-red-50 rounded-lg" data-testid={`delete-cat-${cat.id}`}><Trash2 className="h-4 w-4 text-red-500" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#2A2A2A]">{editCat ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Name *</label>
                  <input className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" value={form.name} onChange={e => f('name', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">नाम (Hindi)</label>
                  <input className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" value={form.name_hi} onChange={e => f('name_hi', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Slug *</label>
                  <input className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm font-mono" value={form.slug} onChange={e => f('slug', e.target.value.toLowerCase().replace(/\s/g,'-'))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Order</label>
                  <input type="number" className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" value={form.order} onChange={e => f('order', parseInt(e.target.value))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Image URL</label>
                <input className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" value={form.image} onChange={e => f('image', e.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border-2 border-[#E6D5BC] rounded-xl text-sm font-semibold text-gray-600">Cancel</button>
                <button onClick={handleSave} className="flex-1 btn-brand-primary py-2.5 font-semibold" data-testid="save-category-btn">
                  {editCat ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
