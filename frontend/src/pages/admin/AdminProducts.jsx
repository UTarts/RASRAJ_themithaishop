import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Plus, Edit, Trash2, LayoutDashboard, Package, Grid3X3, ClipboardList, LogOut, Menu, X, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EMPTY_FORM = { name: '', name_hi: '', description: '', description_hi: '', category_slug: '', prices: { g250: '', g500: '', g1000: '' }, images: [''], ingredients: '', shelf_life: '', in_stock: true, featured: false, badge: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get(`${API}/products`, { headers: authHeaders() }),
        axios.get(`${API}/categories`),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (e) { toast.error("Failed to load products"); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditProduct(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      name: p.name, name_hi: p.name_hi, description: p.description, description_hi: p.description_hi || '',
      category_slug: p.category_slug, prices: p.prices || { g250: '', g500: '', g1000: '' },
      images: p.images?.length ? p.images : [''], ingredients: p.ingredients || '',
      shelf_life: p.shelf_life || '', in_stock: p.in_stock, featured: p.featured, badge: p.badge || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category_slug) { toast.error("Name and category required"); return; }
    const data = {
      ...form,
      prices: { g250: parseFloat(form.prices.g250) || 0, g500: parseFloat(form.prices.g500) || 0, g1000: parseFloat(form.prices.g1000) || 0 },
      images: form.images.filter(Boolean),
      badge: form.badge || null,
    };
    try {
      if (editProduct) {
        await axios.put(`${API}/products/${editProduct.id}`, data, { headers: authHeaders() });
        toast.success("Product updated!");
      } else {
        await axios.post(`${API}/products`, data, { headers: authHeaders() });
        toast.success("Product added!");
      }
      setShowModal(false);
      fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || "Error saving product"); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await axios.delete(`${API}/products/${id}`, { headers: authHeaders() });
      toast.success("Product deleted");
      fetchData();
    } catch (e) { toast.error("Failed to delete"); }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category_slug.includes(search.toLowerCase()));

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

  const f = (key, value) => setForm(p => ({ ...p, [key]: value }));
  const fp = (key, value) => setForm(p => ({ ...p, prices: { ...p.prices, [key]: value } }));

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
            <h1 className="text-lg font-bold text-[#2A2A2A]" style={{ fontFamily: 'Playfair Display, serif' }}>{t('adminProducts')}</h1>
          </div>
          <button onClick={openAdd} className="btn-brand-primary text-sm flex items-center gap-1 px-4 py-2" data-testid="add-product-btn">
            <Plus className="h-4 w-4" /> {t('addProduct')}
          </button>
        </div>
        <div className="p-4 md:p-6">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input className="w-full pl-9 pr-4 py-2 border-2 border-[#E6D5BC] rounded-xl text-sm bg-white" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 rounded-full border-4 border-[#D4AF37] border-t-transparent" /></div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E6D5BC] overflow-hidden" data-testid="products-table">
              <table className="w-full text-sm">
                <thead className="bg-[#F5E6D3]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#2A2A2A]">Product</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#2A2A2A] hidden md:table-cell">Category</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#2A2A2A]">250g</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#2A2A2A] hidden md:table-cell">Stock</th>
                    <th className="text-right px-4 py-3 font-semibold text-[#2A2A2A]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-t border-[#E6D5BC] hover:bg-[#FFF6E5]" data-testid={`product-row-${p.id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F5E6D3] shrink-0">
                            <img src={p.images?.[0]} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                          </div>
                          <div>
                            <p className="font-medium text-[#2A2A2A] leading-tight">{p.name}</p>
                            {p.featured && <span className="text-[10px] bg-[#D4AF37]/20 text-[#B8962E] px-1.5 py-0.5 rounded font-bold">FEATURED</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.category_slug}</td>
                      <td className="px-4 py-3 font-bold text-[#9B111E]">₹{p.prices?.g250}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${p.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {p.in_stock ? 'In Stock' : 'Out'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-[#F5E6D3] rounded-lg" data-testid={`edit-product-${p.id}`}><Edit className="h-4 w-4 text-[#B8962E]" /></button>
                          <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 hover:bg-red-50 rounded-lg" data-testid={`delete-product-${p.id}`}><Trash2 className="h-4 w-4 text-red-500" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No products found</p>}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl" data-testid="product-modal">
            <div className="sticky top-0 bg-white border-b border-[#E6D5BC] px-5 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-bold text-[#2A2A2A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                {editProduct ? t('editProduct') : t('addProduct')}
              </h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Name (English) *</label>
                  <input className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" value={form.name} onChange={e => f('name', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">नाम (Hindi)</label>
                  <input className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" value={form.name_hi} onChange={e => f('name_hi', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Category *</label>
                <select className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" value={form.category_slug} onChange={e => f('category_slug', e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
                <textarea className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" rows={2} value={form.description} onChange={e => f('description', e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[['g250', '250g ₹'], ['g500', '500g ₹'], ['g1000', '1kg ₹']].map(([key, label]) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                    <input type="number" className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" value={form.prices[key]} onChange={e => fp(key, e.target.value)} />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Image URL</label>
                <input className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" value={form.images[0]} onChange={e => f('images', [e.target.value])} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Ingredients</label>
                  <input className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" value={form.ingredients} onChange={e => f('ingredients', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Shelf Life</label>
                  <input className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" value={form.shelf_life} onChange={e => f('shelf_life', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Badge</label>
                  <select className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" value={form.badge} onChange={e => f('badge', e.target.value)}>
                    <option value="">None</option>
                    {['bestseller','premium','new','seasonal'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="in_stock" checked={form.in_stock} onChange={e => f('in_stock', e.target.checked)} className="accent-[#9B111E]" />
                  <label htmlFor="in_stock" className="text-xs font-medium">In Stock</label>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="featured" checked={form.featured} onChange={e => f('featured', e.target.checked)} className="accent-[#D4AF37]" />
                  <label htmlFor="featured" className="text-xs font-medium">Featured</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border-2 border-[#E6D5BC] rounded-xl text-sm font-semibold text-gray-600 hover:bg-[#F5E6D3]">Cancel</button>
                <button onClick={handleSave} className="flex-1 btn-brand-primary py-2.5 font-semibold" data-testid="save-product-btn">
                  {editProduct ? 'Update' : 'Add Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
