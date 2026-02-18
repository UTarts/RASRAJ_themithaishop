import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Package, CheckCircle, Truck, ArrowLeft, RefreshCw, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const STATUS_COLORS = {
  placed: 'bg-blue-100 text-blue-700', accepted: 'bg-green-100 text-green-700',
  preparing: 'bg-yellow-100 text-yellow-700', packed: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700', delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700'
};

export default function DeliveryPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, authHeaders } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/delivery/orders`, { headers: authHeaders() });
      setOrders(r.data);
    } catch (e) { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  };

  const updateStatus = async (ordId, status) => {
    try {
      await axios.put(`${API}/orders/${ordId}/status`, { status, delivery_partner_id: user.id }, { headers: authHeaders() });
      toast.success(`Marked as ${status}`);
      fetchOrders();
    } catch (e) { toast.error("Failed to update"); }
  };

  return (
    <div className="min-h-screen bg-[#FFF6E5] pb-20 md:pb-8">
      <Navbar />
      <div className="container mx-auto px-4 max-w-2xl py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#2A2A2A]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Delivery Panel
            </h1>
            <p className="text-sm text-gray-500">Hello, {user?.name}</p>
          </div>
          <button onClick={fetchOrders} className="p-2 hover:bg-[#F5E6D3] rounded-full text-[#9B111E]" data-testid="refresh-btn">
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-10 w-10 rounded-full border-4 border-[#D4AF37] border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400" data-testid="no-delivery-orders">
            <Truck className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No active deliveries</p>
            <p className="text-sm">New orders will appear here</p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="delivery-orders">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border border-[#E6D5BC] p-4" data-testid={`delivery-order-${order.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-[#9B111E] font-mono text-sm">#{order.order_number}</p>
                    <p className="font-semibold text-[#2A2A2A]">{order.user_name}</p>
                    <p className="text-sm text-gray-500">{order.user_phone}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${STATUS_COLORS[order.status]}`}>
                    {order.status?.replace('_', ' ')}
                  </span>
                </div>

                {/* Address */}
                {order.address && (
                  <div className="bg-[#F5E6D3] rounded-lg p-3 mb-3">
                    <div className="flex gap-2">
                      <MapPin className="h-4 w-4 text-[#9B111E] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-[#2A2A2A] font-medium">{order.address.line1}</p>
                        {order.address.line2 && <p className="text-xs text-gray-500">{order.address.line2}</p>}
                        <p className="text-xs text-gray-600">{order.address.city}, {order.address.pincode}</p>
                        <p className="text-xs text-[#9B111E] font-semibold">Ph: {order.address.phone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items Summary */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Items:</p>
                  {order.items?.slice(0, 3).map((item, i) => (
                    <p key={i} className="text-xs text-[#2A2A2A]">{item.product_name} × {item.quantity} ({item.weight})</p>
                  ))}
                  {order.items?.length > 3 && <p className="text-xs text-gray-400">+{order.items.length - 3} more</p>}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#9B111E]">₹{order.total}</span>
                  <div className="flex gap-2">
                    {order.status === 'packed' && (
                      <button
                        onClick={() => updateStatus(order.id, 'out_for_delivery')}
                        className="flex items-center gap-1 bg-orange-100 text-orange-700 border border-orange-300 text-xs px-3 py-1.5 rounded-full font-semibold hover:bg-orange-200 transition-colors"
                        data-testid={`pickup-${order.id}`}
                      >
                        <Package className="h-3.5 w-3.5" /> Picked Up
                      </button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => updateStatus(order.id, 'delivered')}
                        className="flex items-center gap-1 bg-green-100 text-green-700 border border-green-300 text-xs px-3 py-1.5 rounded-full font-semibold hover:bg-green-200 transition-colors"
                        data-testid={`delivered-${order.id}`}
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
