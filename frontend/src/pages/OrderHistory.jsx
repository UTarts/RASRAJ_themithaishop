import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Package, ChevronRight, ShoppingBag, RefreshCw, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_STEPS = ['placed', 'accepted', 'preparing', 'packed', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = {
  placed: 'Order Placed', accepted: 'Accepted', preparing: 'Preparing',
  packed: 'Packed', out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled'
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const { user, authHeaders } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const r = await axios.get(`${API}/orders`, { headers: authHeaders() });
      setOrders(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getStatusColor = (status) => {
    const map = {
      placed: 'status-placed', accepted: 'status-accepted', preparing: 'status-preparing',
      packed: 'status-packed', out_for_delivery: 'status-out_for_delivery',
      delivered: 'status-delivered', cancelled: 'status-cancelled'
    };
    return map[status] || 'status-placed';
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFF6E5]">
      <Navbar />
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-[#D4AF37] border-t-transparent" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF6E5] pb-20 md:pb-8">
      <Navbar />
      <div className="container mx-auto px-4 max-w-3xl py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#2A2A2A]" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="orders-title">
            {t('myOrders')}
          </h1>
          <button onClick={fetchOrders} className="p-2 hover:bg-[#F5E6D3] rounded-full text-[#9B111E]">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20" data-testid="no-orders">
            <ShoppingBag className="h-16 w-16 text-[#E6D5BC] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#2A2A2A] mb-2">{t('noOrders')}</h2>
            <p className="text-gray-500 mb-6">{t('noOrdersHint')}</p>
            <Link to="/products" className="btn-brand-primary px-8 py-3 font-semibold">{t('shopNow')}</Link>
          </div>
        ) : (
          <div className="space-y-4" data-testid="orders-list">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border border-[#E6D5BC] overflow-hidden" data-testid={`order-${order.id}`}>
                {/* Order Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FFF6E5] transition-colors"
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F5E6D3] flex items-center justify-center">
                      <Package className="h-5 w-5 text-[#9B111E]" />
                    </div>
                    <div>
                      <p className="font-bold text-[#2A2A2A] text-sm">#{order.order_number}</p>
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span className="font-bold text-[#9B111E]">₹{order.total}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === order.id && (
                  <div className="border-t border-[#E6D5BC] p-4 space-y-4">
                    {/* Status Timeline */}
                    {order.status !== 'cancelled' && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Order Progress</p>
                        <div className="flex items-center gap-0">
                          {STATUS_STEPS.map((s, i) => {
                            const currentIdx = STATUS_STEPS.indexOf(order.status);
                            const isCompleted = i <= currentIdx;
                            const isCurrent = i === currentIdx;
                            return (
                              <div key={s} className="flex items-center flex-1">
                                <div className={`w-3 h-3 rounded-full shrink-0 border-2 transition-all ${isCurrent ? 'bg-[#9B111E] border-[#9B111E] scale-125' : isCompleted ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-gray-200 border-gray-200'}`} />
                                {i < STATUS_STEPS.length - 1 && (
                                  <div className={`flex-1 h-0.5 ${i < currentIdx ? 'bg-[#D4AF37]' : 'bg-gray-200'}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[9px] text-gray-400">Placed</span>
                          <span className="text-[9px] text-gray-400">Delivered</span>
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Items</p>
                      <div className="space-y-2">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            {item.image && <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-[#E6D5BC]" />}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#2A2A2A]">{item.product_name}</p>
                              <p className="text-xs text-gray-500">{item.weight} × {item.quantity}</p>
                            </div>
                            <p className="text-sm font-bold text-[#9B111E]">₹{item.price * item.quantity}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Address */}
                    {order.address && (
                      <div className="bg-[#F5E6D3] rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Delivery Address</p>
                        <p className="text-sm text-[#2A2A2A]">{order.address.line1}, {order.address.city}, {order.address.pincode}</p>
                        <p className="text-xs text-gray-500">Ph: {order.address.phone}</p>
                      </div>
                    )}

                    {/* Payment */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Payment: <span className="font-medium text-[#2A2A2A] uppercase">{order.payment_method}</span></span>
                      <span className="font-bold text-[#9B111E]">Total: ₹{order.total}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
