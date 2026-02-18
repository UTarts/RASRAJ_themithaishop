import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Search, Filter, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCat = searchParams.get('category') || 'all';
  const searchQ = searchParams.get('search') || '';

  useEffect(() => {
    if (searchQ) setSearch(searchQ);
  }, [searchQ]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCat && selectedCat !== 'all') params.category = selectedCat;
      if (search) params.search = search;
      const [prodRes, catRes] = await Promise.all([
        axios.get(`${API}/products`, { params }),
        axios.get(`${API}/categories`),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedCat, search]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search.trim()) params.set('search', search.trim());
    else params.delete('search');
    setSearchParams(params);
  };

  const setCategory = (slug) => {
    const params = new URLSearchParams();
    if (slug !== 'all') params.set('category', slug);
    if (search) params.set('search', search);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-[#FFF6E5] pb-20 md:pb-0">
      <Navbar />

      <div className="container mx-auto px-4 max-w-7xl py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#2A2A2A] mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('shop')}
          </h1>
          <div className="h-0.5 w-12 bg-[#D4AF37] rounded-full" />
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative mb-6" data-testid="products-search">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#B8962E]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search')}
            className="w-full pl-10 pr-10 py-2.5 rounded-full border-2 border-[#E6D5BC] bg-white text-sm focus:border-[#D4AF37]"
            data-testid="product-search-input"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchParams(new URLSearchParams()); }} className="absolute right-3 top-3">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </form>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-6">
          <button
            onClick={() => setCategory('all')}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${selectedCat === 'all' ? 'bg-[#9B111E] text-white border-[#9B111E]' : 'bg-white text-[#2A2A2A] border-[#E6D5BC] hover:border-[#D4AF37]'}`}
            data-testid="cat-all"
          >
            {t('all')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${selectedCat === cat.slug ? 'bg-[#9B111E] text-white border-[#9B111E]' : 'bg-white text-[#2A2A2A] border-[#E6D5BC] hover:border-[#D4AF37]'}`}
              data-testid={`cat-${cat.slug}`}
            >
              {lang === 'hi' && cat.name_hi ? cat.name_hi : cat.name}
            </button>
          ))}
        </div>

        {/* Products Count */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-4" data-testid="products-count">
            {products.length} {products.length === 1 ? 'product' : 'products'} found
          </p>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-60 animate-pulse border border-[#E6D5BC]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400" data-testid="no-products">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No sweets found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="products-grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <MobileNav />
    </div>
  );
}
