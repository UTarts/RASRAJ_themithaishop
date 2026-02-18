import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronRight, MapPin, Phone, Clock, Gift, Award, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const HERO_IMAGES = [
  { url: 'https://images.pexels.com/photos/28769884/pexels-photo-28769884.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', alt: 'Festive Indian Sweets Spread' },
  { url: 'https://images.pexels.com/photos/8887025/pexels-photo-8887025.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', alt: 'Vibrant Sweets in Bowls' },
];

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, featRes] = await Promise.all([
          axios.get(`${API}/categories`),
          axios.get(`${API}/products/featured`),
        ]);
        setCategories(catRes.data);
        setFeatured(featRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Hero auto-slide
  useEffect(() => {
    const timer = setInterval(() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF6E5] pb-20 md:pb-0">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ minHeight: '320px' }} data-testid="hero-section">
        <div className="relative w-full" style={{ height: '360px' }}>
          {HERO_IMAGES.map((img, i) => (
            <div key={i} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: heroIdx === i ? 1 : 0 }}>
              <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
              <div className="absolute inset-0 hero-overlay" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#9B111E]/60 to-transparent" />
            </div>
          ))}
          <div className="absolute inset-0 flex items-center px-6 md:px-12">
            <div className="max-w-lg fade-in-up">
              <p className="text-[#D4AF37] text-sm font-semibold tracking-widest uppercase mb-2" style={{ fontFamily: 'Great Vibes, cursive', fontSize: '18px' }}>
                Amethi, Uttar Pradesh
              </p>
              <h1 className="text-white font-bold leading-tight mb-3" style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px, 5vw, 52px)' }}>
                {t('usp')}
              </h1>
              <p className="text-white/90 text-sm md:text-base mb-6 max-w-sm">{t('usp_sub')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/products')}
                  className="btn-brand-secondary bg-[#D4AF37] border-[#D4AF37] text-[#2A2A2A] hover:bg-[#B8962E] hover:border-[#B8962E] transition-colors"
                  data-testid="hero-shop-btn"
                >
                  {t('shopNow')}
                </button>
              </div>
            </div>
          </div>
          {/* Slide indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {HERO_IMAGES.map((_, i) => (
              <button key={i} onClick={() => setHeroIdx(i)} className={`w-2 h-2 rounded-full transition-all ${heroIdx === i ? 'bg-[#D4AF37] w-6' : 'bg-white/60'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* USP Banner */}
      <section className="usp-banner py-4 no-select" data-testid="usp-banner">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 text-white text-center">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#D4AF37]" />
              <span className="text-sm font-medium">100% Pure & Fresh</span>
            </div>
            <div className="hidden md:block h-4 w-px bg-white/30" />
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#D4AF37]" />
              <span className="text-sm font-bold" style={{ fontFamily: 'Rozha One, serif' }}>
                {lang === 'hi' ? 'हम डिब्बा नहीं तोलते' : 'We Do Not Weight Box'}
              </span>
            </div>
            <div className="hidden md:block h-4 w-px bg-white/30" />
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#D4AF37]" />
              <span className="text-sm font-medium">Since 1985 — Amethi</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 px-4" data-testid="categories-section">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#2A2A2A]" style={{ fontFamily: 'Playfair Display, serif' }}>
              {t('categories')}
            </h2>
            <Link to="/products" className="text-[#9B111E] text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              {t('viewAll')} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            <button
              onClick={() => navigate('/products')}
              className="category-pill shrink-0"
              data-testid="category-all"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#9B111E] to-[#7A0C16] flex items-center justify-center text-white text-lg">
                ✨
              </div>
              <span className="text-xs font-semibold text-[#2A2A2A]">{t('all')}</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => navigate(`/products?category=${cat.slug}`)}
                className="category-pill shrink-0"
                data-testid={`category-${cat.slug}`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#E6D5BC]">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }} />
                </div>
                <span className="text-xs font-semibold text-[#2A2A2A] max-w-[64px] text-center leading-tight">
                  {lang === 'hi' && cat.name_hi ? cat.name_hi : cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-4 px-4" data-testid="featured-section">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2A2A2A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                {t('featured')} {t('shop')}
              </h2>
              <div className="h-0.5 w-16 bg-[#D4AF37] mt-1 rounded-full" />
            </div>
            <Link to="/products" className="text-[#9B111E] text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              {t('viewAll')} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-60 animate-pulse border border-[#E6D5BC]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="featured-products-grid">
              {featured.map((product, i) => (
                <div key={product.id} className={`fade-in-up stagger-${Math.min(i + 1, 4)}`}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Coupon Banner */}
      <section className="py-6 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="bg-gradient-to-r from-[#D4AF37]/20 to-[#9B111E]/10 rounded-2xl p-6 border border-[#D4AF37]/30">
            <h3 className="font-bold text-[#9B111E] text-lg mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>{t('availableCoupons')}</h3>
            <div className="flex flex-wrap gap-3">
              {[
                { code: 'RASRAJ10', desc: '10% off (min ₹200)', color: '#9B111E' },
                { code: 'FIRST50', desc: '₹50 flat off', color: '#B8962E' },
                { code: 'WELCOME20', desc: '20% off (min ₹500)', color: '#7A0C16' },
              ].map(c => (
                <div key={c.code} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border-2 border-dashed" style={{ borderColor: c.color }}>
                  <Gift className="h-4 w-4" style={{ color: c.color }} />
                  <div>
                    <div className="font-bold text-sm" style={{ color: c.color }}>{c.code}</div>
                    <div className="text-xs text-gray-500">{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Store Info */}
      <section className="py-8 px-4 bg-[#9B111E]" data-testid="store-info">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-white text-2xl font-bold mb-6 text-center" style={{ fontFamily: 'Playfair Display, serif' }}>{t('storeTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <p className="text-white/90 text-sm">{t('storeAddress')}</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <p className="text-white/90 text-sm">{t('storeHours')}</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <Phone className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <p className="text-white/90 text-sm">+91 98765 43210</p>
            </div>
          </div>
        </div>
      </section>

      {/* Free Delivery Banner */}
      <div className="bg-[#D4AF37] py-2 text-center text-[#2A2A2A] text-sm font-semibold">
        {t('freeDelivery')} | {t('usp')}
      </div>

      <MobileNav />
    </div>
  );
}
