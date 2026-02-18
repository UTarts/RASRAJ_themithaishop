import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ShoppingCart, Minus, Plus, Package, Clock, Leaf } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WEIGHT_OPTIONS = [
  { label: '250g', key: 'g250' },
  { label: '500g', key: 'g500' },
  { label: '1kg', key: 'g1000' },
];

const BADGE_CLASSES = {
  bestseller: 'bg-[#9B111E] text-white',
  premium: 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-[#2A2A2A]',
  new: 'bg-green-600 text-white',
  seasonal: 'bg-purple-600 text-white',
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeight, setSelectedWeight] = useState('250g');
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const { addItem } = useCart();
  const { lang, t } = useLanguage();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const [prodRes, recRes] = await Promise.all([
          axios.get(`${API}/products/${id}`),
          axios.get(`${API}/products/${id}/recommendations`),
        ]);
        setProduct(prodRes.data);
        setRecs(recRes.data);
      } catch (e) { navigate('/products'); }
      finally { setLoading(false); }
    };
    fetchProduct();
    setImgIdx(0);
    setSelectedWeight('250g');
    setQty(1);
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#FFF6E5]">
      <Navbar />
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-[#D4AF37] border-t-transparent" />
      </div>
    </div>
  );
  if (!product) return null;

  const name = lang === 'hi' && product.name_hi ? product.name_hi : product.name;
  const description = lang === 'hi' && product.description_hi ? product.description_hi : product.description;
  const weightKey = WEIGHT_OPTIONS.find(w => w.label === selectedWeight)?.key;
  const price = product.prices?.[weightKey] || 0;
  const images = product.images?.length > 0 ? product.images : ['https://images.pexels.com/photos/14610769/pexels-photo-14610769.jpeg?auto=compress&cs=tinysrgb&w=400'];

  const handleAddToCart = () => {
    addItem(product, selectedWeight, qty);
    toast.success(`${product.name} added to cart!`, {
      description: `${qty}x ${selectedWeight}`,
      action: { label: 'View Cart', onClick: () => navigate('/cart') }
    });
  };

  return (
    <div className="min-h-screen bg-[#FFF6E5] pb-24 md:pb-0">
      <Navbar />
      <div className="container mx-auto px-4 max-w-5xl py-6">
        {/* Breadcrumb */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-[#9B111E] text-sm mb-6 hover:gap-2 transition-all">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div data-testid="product-images">
            <div className="img-zoom rounded-2xl overflow-hidden border-2 border-[#E6D5BC] aspect-square bg-[#F5E6D3] mb-3">
              <img
                src={images[imgIdx]}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://images.pexels.com/photos/14610769/pexels-photo-14610769.jpeg?auto=compress&cs=tinysrgb&w=400'; }}
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${imgIdx === i ? 'border-[#D4AF37]' : 'border-[#E6D5BC]'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {product.badge && (
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${BADGE_CLASSES[product.badge] || 'bg-gray-200 text-gray-700'}`}>
                {t(product.badge)}
              </span>
            )}
            <h1 className="text-3xl font-bold text-[#2A2A2A] mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
              {name}
            </h1>
            {lang === 'hi' && product.name && (
              <p className="text-[#B8962E] text-lg mb-3" style={{ fontFamily: 'Rozha One, serif' }}>{product.name}</p>
            )}

            {/* USP Tag */}
            <div className="inline-flex items-center gap-1 bg-[#9B111E]/10 text-[#9B111E] text-xs font-bold px-3 py-1 rounded-full mb-4 border border-[#9B111E]/20">
              {t('usp')}
            </div>

            <p className="text-[#2A2A2A]/80 text-sm leading-relaxed mb-6">{description}</p>

            {/* Weight Selector */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-[#2A2A2A] mb-2">{t('weight')}</p>
              <div className="flex gap-3" data-testid="weight-selector">
                {WEIGHT_OPTIONS.map(w => (
                  <button
                    key={w.label}
                    onClick={() => setSelectedWeight(w.label)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${selectedWeight === w.label ? 'bg-[#9B111E] text-white border-[#9B111E]' : 'bg-white text-[#2A2A2A] border-[#E6D5BC] hover:border-[#D4AF37]'}`}
                    data-testid={`weight-${w.label}`}
                  >
                    <div>{w.label}</div>
                    <div className={`text-xs ${selectedWeight === w.label ? 'text-white/80' : 'text-[#9B111E]'}`}>₹{product.prices?.[w.key] || 0}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-3xl font-bold text-[#9B111E]">₹{price}</span>
              <span className="text-gray-400 text-sm">for {selectedWeight}</span>
            </div>

            {/* Quantity + Add to Cart */}
            {product.in_stock ? (
              <div className="flex gap-3 mb-6">
                <div className="flex items-center gap-2 bg-white rounded-full border-2 border-[#E6D5BC] px-3">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="text-[#9B111E] p-1" data-testid="qty-decrease"><Minus className="h-4 w-4" /></button>
                  <span className="w-6 text-center font-bold text-sm" data-testid="qty-value">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} className="text-[#9B111E] p-1" data-testid="qty-increase"><Plus className="h-4 w-4" /></button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 btn-brand-primary text-sm font-semibold"
                  data-testid="add-to-cart-btn"
                >
                  <ShoppingCart className="h-4 w-4" /> {t('addToCart')}
                </button>
              </div>
            ) : (
              <div className="py-3 px-6 bg-gray-100 rounded-full text-center text-gray-500 font-medium mb-6">{t('outOfStock')}</div>
            )}

            {/* Product Info */}
            <div className="space-y-3 pt-4 border-t border-[#E6D5BC]">
              {product.ingredients && (
                <div className="flex gap-2 text-sm">
                  <Leaf className="h-4 w-4 text-[#9B111E] shrink-0 mt-0.5" />
                  <div><span className="font-semibold text-[#2A2A2A]">{t('ingredients')}: </span><span className="text-gray-600">{product.ingredients}</span></div>
                </div>
              )}
              {product.shelf_life && (
                <div className="flex gap-2 text-sm">
                  <Clock className="h-4 w-4 text-[#9B111E] shrink-0 mt-0.5" />
                  <div><span className="font-semibold text-[#2A2A2A]">{t('shelfLife')}: </span><span className="text-gray-600">{product.shelf_life}</span></div>
                </div>
              )}
              <div className="flex gap-2 text-sm">
                <Package className="h-4 w-4 text-[#9B111E] shrink-0 mt-0.5" />
                <div><span className="font-semibold text-[#2A2A2A]">Packaging: </span><span className="text-gray-600">Premium hygiene-sealed box</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {recs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-[#2A2A2A] mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              {t('relatedProducts')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recs.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
