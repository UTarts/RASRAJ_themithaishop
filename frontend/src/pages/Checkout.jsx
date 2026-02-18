import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { MapPin, CreditCard, Truck, Home, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user, authHeaders } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { coupon = '', discount = 0, deliveryCharge = 0, total = subtotal } = location.state || {};

  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [address, setAddress] = useState({
    label: 'Home', line1: '', line2: '', city: '', state: 'Uttar Pradesh', pincode: '', phone: user?.phone || ''
  });

  // Load saved addresses
  const [savedAddresses, setSavedAddresses] = useState(user?.addresses || []);

  useEffect(() => {
    if (items.length === 0) navigate('/cart');
  }, []);

  const handleAddressChange = (field, value) => setAddress(prev => ({ ...prev, [field]: value }));

  const validateAddress = () => {
    if (!address.line1 || !address.city || !address.pincode || !address.phone) {
      toast.error("Please fill all address fields");
      return false;
    }
    if (address.pincode.length !== 6) { toast.error("Enter valid 6-digit pincode"); return false; }
    if (address.phone.length < 10) { toast.error("Enter valid phone number"); return false; }
    return true;
  };

  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handleRazorpayPayment = async (finalTotal) => {
    const ok = await loadRazorpay();
    if (!ok) { toast.error("Payment gateway unavailable. Switching to COD."); return null; }
    try {
      const keyRes = await axios.get(`${API}/payment/key`, { headers: authHeaders() });
      const orderRes = await axios.post(`${API}/payment/create-order`, { amount: finalTotal }, { headers: authHeaders() });
      if (orderRes.data.mock) {
        // Mock payment mode
        toast.info("Using mock payment (Razorpay keys not configured)");
        return { razorpay_payment_id: `mock_pay_${Date.now()}`, razorpay_order_id: orderRes.data.id, razorpay_signature: 'mock' };
      }
      return new Promise((resolve, reject) => {
        const options = {
          key: keyRes.data.key_id,
          amount: orderRes.data.amount,
          currency: 'INR',
          name: 'RAS RAJ – The Mithai Shop',
          description: 'Order Payment',
          order_id: orderRes.data.id,
          prefill: { name: user?.name || '', email: user?.email || '', contact: address.phone },
          theme: { color: '#9B111E' },
          handler: (response) => resolve(response),
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', () => reject(new Error('Payment failed')));
        rzp.open();
      });
    } catch (e) {
      throw e;
    }
  };

  const placeOrder = async () => {
    if (!validateAddress()) return;
    setPlacing(true);
    try {
      let paymentData = {};
      if (paymentMethod === 'razorpay') {
        const finalTotal = total || subtotal;
        try {
          const rzpData = await handleRazorpayPayment(finalTotal);
          paymentData = { razorpay_payment_id: rzpData.razorpay_payment_id, razorpay_order_id: rzpData.razorpay_order_id };
        } catch (e) {
          toast.error("Payment cancelled or failed");
          setPlacing(false);
          return;
        }
      }

      const orderData = {
        items: items.map(i => ({
          product_id: i.product_id,
          product_name: i.product_name,
          weight: i.weight,
          quantity: i.quantity,
          price: i.price,
          image: i.image,
        })),
        address,
        delivery_type: deliveryType,
        payment_method: paymentMethod,
        coupon_code: coupon || null,
        notes: null,
        ...paymentData,
      };

      const r = await axios.post(`${API}/orders`, orderData, { headers: authHeaders() });
      clearCart();
      toast.success(t('orderPlaced'));
      navigate('/orders', { state: { newOrder: r.data } });
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to place order");
    } finally { setPlacing(false); }
  };

  const finalTotal = total || subtotal;

  return (
    <div className="min-h-screen bg-[#FFF6E5] pb-24 md:pb-8">
      <Navbar />
      <div className="container mx-auto px-4 max-w-3xl py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/cart')} className="p-2 hover:bg-[#F5E6D3] rounded-full text-[#9B111E]"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-2xl font-bold text-[#2A2A2A]" style={{ fontFamily: 'Playfair Display, serif' }}>Checkout</h1>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl p-4 border border-[#E6D5BC] mb-6">
          <h3 className="font-semibold text-[#2A2A2A] mb-3">Your Order ({items.length} items)</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {items.map(item => (
              <div key={`${item.product_id}-${item.weight}`} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.product_name} × {item.quantity} ({item.weight})</span>
                <span className="font-medium">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E6D5BC] mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">{t('subtotal')}</span><span>₹{subtotal}</span></div>
            {deliveryCharge > 0 && <div className="flex justify-between"><span className="text-gray-500">{t('deliveryCharge')}</span><span>₹{deliveryCharge}</span></div>}
            {deliveryCharge === 0 && <div className="flex justify-between text-green-600"><span>Delivery</span><span>FREE</span></div>}
            {discount > 0 && <div className="flex justify-between text-green-600"><span>{t('discount')}</span><span>-₹{discount}</span></div>}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-[#E6D5BC]">
              <span>{t('total')}</span><span className="text-[#9B111E]" data-testid="checkout-total">₹{finalTotal}</span>
            </div>
          </div>
        </div>

        {/* Delivery Type */}
        <div className="bg-white rounded-xl p-4 border border-[#E6D5BC] mb-4">
          <h3 className="font-semibold text-[#2A2A2A] mb-3 flex items-center gap-2">
            <Truck className="h-4 w-4 text-[#9B111E]" /> {t('deliveryType')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[{ id: 'delivery', label: t('homeDelivery'), icon: Home }, { id: 'pickup', label: t('storePickup'), icon: MapPin }].map(opt => (
              <button
                key={opt.id}
                onClick={() => setDeliveryType(opt.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${deliveryType === opt.id ? 'border-[#9B111E] bg-[#9B111E]/5 text-[#9B111E]' : 'border-[#E6D5BC] text-gray-600 hover:border-[#D4AF37]'}`}
                data-testid={`delivery-type-${opt.id}`}
              >
                <opt.icon className="h-4 w-4" /> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        {deliveryType === 'delivery' && (
          <div className="bg-white rounded-xl p-4 border border-[#E6D5BC] mb-4" data-testid="address-form">
            <h3 className="font-semibold text-[#2A2A2A] mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#9B111E]" /> {t('deliveryAddress')}
            </h3>
            <div className="space-y-3">
              <input className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" placeholder={t('addressLine')} value={address.line1} onChange={e => handleAddressChange('line1', e.target.value)} data-testid="address-line1" />
              <input className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" placeholder="Landmark (optional)" value={address.line2} onChange={e => handleAddressChange('line2', e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input className="border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" placeholder={t('city')} value={address.city} onChange={e => handleAddressChange('city', e.target.value)} data-testid="address-city" />
                <input className="border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" placeholder={t('pincode')} value={address.pincode} onChange={e => handleAddressChange('pincode', e.target.value.replace(/\D/g,'').slice(0,6))} data-testid="address-pincode" />
              </div>
              <input className="w-full border-2 border-[#E6D5BC] rounded-lg px-3 py-2 text-sm" placeholder={t('phone')} value={address.phone} onChange={e => handleAddressChange('phone', e.target.value.replace(/\D/g,'').slice(0,10))} data-testid="address-phone" />
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div className="bg-white rounded-xl p-4 border border-[#E6D5BC] mb-6">
          <h3 className="font-semibold text-[#2A2A2A] mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#9B111E]" /> {t('paymentMethod')}
          </h3>
          <div className="space-y-2">
            {[
              { id: 'cod', label: t('cod'), desc: 'Pay when your order arrives' },
              { id: 'razorpay', label: 'Pay Online (UPI / Card)', desc: 'Secure payment via Razorpay' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setPaymentMethod(opt.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${paymentMethod === opt.id ? 'border-[#9B111E] bg-[#9B111E]/5' : 'border-[#E6D5BC] hover:border-[#D4AF37]'}`}
                data-testid={`payment-${opt.id}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === opt.id ? 'border-[#9B111E]' : 'border-gray-300'}`}>
                  {paymentMethod === opt.id && <div className="w-2 h-2 rounded-full bg-[#9B111E]" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#2A2A2A]">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Place Order Button */}
        <button
          onClick={placeOrder}
          disabled={placing}
          className="w-full btn-brand-primary py-4 text-base font-semibold flex items-center justify-center gap-2"
          data-testid="place-order-btn"
        >
          {placing ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
          ) : (
            <><CheckCircle className="h-5 w-5" /> {t('placeOrder')} — ₹{finalTotal}</>
          )}
        </button>
      </div>
      <MobileNav />
    </div>
  );
}
