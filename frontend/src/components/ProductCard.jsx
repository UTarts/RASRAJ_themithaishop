import { useNavigate } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const BADGE_CLASSES = {
  bestseller: 'badge-bestseller',
  premium: 'badge-premium',
  new: 'badge-new',
  seasonal: 'badge-seasonal',
};

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  if (!product) return null;

  const name = lang === 'hi' && product.name_hi ? product.name_hi : product.name;
  const price = product.prices?.g250 || 0;
  const image = product.images?.[0] || 'https://images.pexels.com/photos/14610769/pexels-photo-14610769.jpeg?auto=compress&cs=tinysrgb&w=400';

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addItem(product, '250g');
    toast.success(`${product.name} added to cart!`, {
      description: '250g added',
      action: { label: 'View Cart', onClick: () => navigate('/cart') }
    });
  };

  return (
    <div
      className="product-card bg-white rounded-xl border border-[#E6D5BC] overflow-hidden cursor-pointer group"
      onClick={() => navigate(`/products/${product.id}`)}
      data-testid={`product-card-${product.id}`}
    >
      {/* Image */}
      <div className="img-zoom relative aspect-square overflow-hidden bg-[#F5E6D3]">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { e.target.src = 'https://images.pexels.com/photos/14610769/pexels-photo-14610769.jpeg?auto=compress&cs=tinysrgb&w=400'; }}
        />
        {product.badge && (
          <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE_CLASSES[product.badge] || 'bg-gray-500 text-white'}`}>
            {t(product.badge)}
          </span>
        )}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-black/60 px-3 py-1 rounded-full">{t('outOfStock')}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-[#2A2A2A] text-sm leading-tight mb-1 line-clamp-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {name}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-[10px] text-gray-400">from </span>
            <span className="text-[#9B111E] font-bold text-sm">₹{price}</span>
            <span className="text-[10px] text-gray-400"> /250g</span>
          </div>
          {product.in_stock && (
            <button
              onClick={handleAddToCart}
              className="p-1.5 bg-[#9B111E] text-white rounded-full hover:bg-[#7A0C16] transition-colors active:scale-95"
              data-testid={`add-to-cart-${product.id}`}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
