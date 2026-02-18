import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingBag, Gift, Tag, ChevronRight, ArrowLeft } from "lucide-react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Cart() {
  const { items, updateItem, removeItem, clearCart, subtotal, cartCount } = useCart();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponDesc, setCouponDesc] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const deliveryCharge = subtotal >= 500 ? 0 : (items.length > 0 ? 40 : 0);
  const total = subtotal + deliveryCharge - discount;

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    try {
      const r = await axios.post(`${API}/coupons/validate`, { code: coupon, subtotal });
      setDiscount(r.data.discount);
      setCouponDesc(r.data.description);
      toast.success(`Coupon applied! ${r.data.description}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Invalid coupon");
    } finally { setCouponLoading(false); }
  };

  if (items.length === 0) return (
    <div className="min-h-screen bg-[#FFF6E5]">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4" data-testid="empty-cart">
        <ShoppingBag className="h-20 w-20 text-[#E6D5BC] mb-4" />
        <h2 className="text-2xl font-bold text-[#2A2A2A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{t('emptyCart')}</h2>
        <p className="text-gray-500 mb-6">Add some delicious sweets to your cart</p>
        <Link to="/products" className="btn-brand-primary px-8 py-3 font-semibold">{t('continueShopping')}</Link>
      </div>
      <MobileNav />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF6E5] pb-24 md:pb-8">
      <Navbar />
      <div className="container mx-auto px-4 max-w-5xl py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F5E6D3] rounded-full text-[#9B111E]"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-2xl font-bold text-[#2A2A2A]" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="cart-title">
            {t('yourCart')} ({cartCount})
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-3" data-testid="cart-items">
            {items.map(item => {
              const name = lang === 'hi' && item.product_name_hi ? item.product_name_hi : item.product_name;
              return (
                <div key={`${item.product_id}-${item.weight}`} className="bg-white rounded-xl p-4 border border-[#E6D5BC] flex gap-4" data-testid={`cart-item-${item.product_id}`}>
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#F5E6D3] shrink-0">
                    <img src={item.image} alt={name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#2A2A2A] text-sm truncate">{name}</h3>
                    <p className="text-[#B8962E] text-xs font-medium">{item.weight}</p>
                    <p className="text-[#9B111E] font-bold mt-1">₹{item.price}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 bg-[#F5E6D3] rounded-full px-2 py-1">
                        <button onClick={() => updateItem(item.product_id, item.weight, item.quantity - 1)} className="text-[#9B111E]" data-testid={`decrease-${item.product_id}`}><Minus className="h-3 w-3" /></button>
                        <span className="text-sm font-bold w-4 text-center" data-testid={`qty-${item.product_id}`}>{item.quantity}</span>
                        <button onClick={() => updateItem(item.product_id, item.weight, item.quantity + 1)} className="text-[#9B111E]" data-testid={`increase-${item.product_id}`}><Plus className="h-3 w-3" /></button>
                      </div>
                      <button onClick={() => removeItem(item.product_id, item.weight)} className="text-red-400 hover:text-red-600 p-1" data-testid={`remove-${item.product_id}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[#9B111E]">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              );
            })}
            {/* Free Delivery Progress */}
            {subtotal < 500 && (
              <div className="bg-[#FFF6E5] rounded-xl p-4 border border-[#E6D5BC]">
                <p className="text-sm text-gray-600 mb-2">Add ₹{500 - subtotal} more for <span className="text-[#9B111E] font-bold">FREE delivery!</span></p>
                <div className="h-2 bg-[#E6D5BC] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#9B111E] to-[#D4AF37] rounded-full transition-all" style={{ width: `${(subtotal / 500) * 100}%` }} />
                </div>
              </div>
            )}
            {subtotal >= 500 && (
              <div className="bg-green-50 rounded-xl p-3 border border-green-200 text-green-700 text-sm font-medium text-center">
                You get FREE delivery!
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="bg-white rounded-xl p-4 border border-[#E6D5BC]">
              <h3 className="font-semibold text-[#2A2A2A] mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#9B111E]" /> {t('couponCode')}
              </h3>
              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={e => setCoupon(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm"
                  data-testid="coupon-input"
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponLoading}
                  className="btn-brand-primary text-xs px-4"
                  data-testid="apply-coupon-btn"
                >
                  {couponLoading ? '...' : t('apply')}
                </button>
              </div>
              {couponDesc && <p className="text-green-600 text-xs mt-2 font-medium">{couponDesc}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {['RASRAJ10', 'FIRST50', 'WELCOME20'].map(c => (
                  <button key={c} onClick={() => setCoupon(c)} className="text-[10px] bg-[#F5E6D3] text-[#9B111E] px-2 py-1 rounded font-mono font-bold">{c}</button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl p-4 border border-[#E6D5BC]" data-testid="order-summary">
              <h3 className="font-semibold text-[#2A2A2A] mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">{t('subtotal')}</span><span className="font-medium">₹{subtotal}</span></div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('deliveryCharge')}</span>
                  <span className={deliveryCharge === 0 ? 'text-green-600 font-medium' : 'font-medium'}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('discount')}</span><span>-₹{discount}</span>
                  </div>
                )}
                <div className="border-t border-[#E6D5BC] pt-2 flex justify-between font-bold text-lg">
                  <span className="text-[#2A2A2A]">{t('total')}</span>
                  <span className="text-[#9B111E]" data-testid="order-total">₹{total}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout', { state: { coupon, discount, deliveryCharge, total } })}
                className="w-full mt-4 btn-brand-primary py-3 font-semibold flex items-center justify-center gap-2"
                data-testid="checkout-btn"
              >
                {t('checkout')} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
