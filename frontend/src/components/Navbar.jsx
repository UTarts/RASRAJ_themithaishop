import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Search, LogOut, Package, Settings, Truck, X, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_rasraj-ecommerce/artifacts/9xpxuu3p_rasraj_logo.jpg";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { t, toggleLanguage, lang } = useLanguage();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
    setShowUserMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFF6E5]/95 backdrop-blur-md border-b border-[#E6D5BC]" style={{ boxShadow: '0 2px 8px rgba(155,17,30,0.08)' }}>
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-select" data-testid="nav-logo">
            <img src={LOGO_URL} alt="RAS RAJ" className="h-10 w-10 rounded-full object-cover border-2 border-[#D4AF37]" onError={(e) => { e.target.style.display='none'; }} />
            <div className="hidden sm:block">
              <div className="font-playfair font-bold text-[#9B111E] text-lg leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>RAS RAJ</div>
              <div className="text-[10px] text-[#B8962E] font-medium tracking-widest uppercase" style={{ fontFamily: 'Great Vibes, cursive', fontSize: '11px' }}>The Mithai Shop</div>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-sm mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search')}
                className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-[#E6D5BC] bg-white text-sm focus:border-[#D4AF37] transition-colors"
                data-testid="search-input"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#B8962E]" />
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#D4AF37] text-[#9B111E] text-xs font-semibold hover:bg-[#FFF6E5] transition-colors"
              data-testid="language-toggle"
            >
              {lang === 'en' ? 'हिं' : 'EN'}
            </button>

            {/* Mobile Search */}
            <button onClick={() => setShowSearch(!showSearch)} className="md:hidden p-2 rounded-full hover:bg-[#F5E6D3] text-[#9B111E]" data-testid="mobile-search-btn">
              <Search className="h-5 w-5" />
            </button>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 rounded-full hover:bg-[#F5E6D3] text-[#9B111E] transition-colors" data-testid="cart-icon">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#9B111E] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold" data-testid="cart-count">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 rounded-full hover:bg-[#F5E6D3] text-[#9B111E] transition-colors"
                data-testid="user-menu-btn"
              >
                {user?.picture ? (
                  <img src={user.picture} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-[#E6D5BC] py-2 z-50" data-testid="user-dropdown">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-[#E6D5BC]">
                        <div className="font-semibold text-[#2A2A2A] text-sm">{user.name}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                      <Link to="/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-[#2A2A2A] hover:bg-[#F5E6D3] transition-colors" onClick={() => setShowUserMenu(false)} data-testid="my-orders-link">
                        <Package className="h-4 w-4 text-[#9B111E]" /> {t('myOrders')}
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-[#2A2A2A] hover:bg-[#F5E6D3] transition-colors" onClick={() => setShowUserMenu(false)} data-testid="admin-link">
                          <Settings className="h-4 w-4 text-[#9B111E]" /> Admin Panel
                        </Link>
                      )}
                      {user.role === 'delivery_partner' && (
                        <Link to="/delivery" className="flex items-center gap-2 px-4 py-2 text-sm text-[#2A2A2A] hover:bg-[#F5E6D3] transition-colors" onClick={() => setShowUserMenu(false)} data-testid="delivery-link">
                          <Truck className="h-4 w-4 text-[#9B111E]" /> Delivery Panel
                        </Link>
                      )}
                      <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors" data-testid="logout-btn">
                        <LogOut className="h-4 w-4" /> {t('logout')}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="flex items-center gap-2 px-4 py-2 text-sm text-[#2A2A2A] hover:bg-[#F5E6D3]" onClick={() => setShowUserMenu(false)} data-testid="login-link">
                        <User className="h-4 w-4 text-[#9B111E]" /> {t('login')} / {t('register')}
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search')}
                className="w-full pl-10 pr-10 py-2 rounded-full border-2 border-[#E6D5BC] bg-white text-sm"
                autoFocus
                data-testid="mobile-search-input"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#B8962E]" />
              <button type="button" onClick={() => setShowSearch(false)} className="absolute right-3 top-2.5">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Click outside to close menus */}
      {(showUserMenu) && (
        <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
      )}
    </header>
  );
}
