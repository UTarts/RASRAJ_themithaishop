import { Link, useLocation } from "react-router-dom";
import { Home, Grid3X3, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function MobileNav() {
  const { cartCount } = useCart();
  const { t } = useLanguage();
  const location = useLocation();
  const path = location.pathname;

  const isActive = (href) => path === href || (href !== '/' && path.startsWith(href));

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E6D5BC] z-50 flex md:hidden justify-around py-2 no-select" style={{ boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)' }} data-testid="mobile-nav">
      <Link to="/" className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-lg transition-colors ${isActive('/') && path === '/' ? 'text-[#9B111E]' : 'text-gray-500 hover:text-[#9B111E]'}`} data-testid="mobile-nav-home">
        <Home className={`h-5 w-5 ${isActive('/') && path === '/' ? 'text-[#9B111E]' : ''}`} />
        <span className="text-[10px] font-medium">{t('home')}</span>
      </Link>
      <Link to="/products" className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-lg transition-colors ${isActive('/products') ? 'text-[#9B111E]' : 'text-gray-500 hover:text-[#9B111E]'}`} data-testid="mobile-nav-shop">
        <Grid3X3 className={`h-5 w-5 ${isActive('/products') ? 'text-[#9B111E]' : ''}`} />
        <span className="text-[10px] font-medium">{t('shop')}</span>
      </Link>
      <Link to="/cart" className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-lg transition-colors relative ${isActive('/cart') ? 'text-[#9B111E]' : 'text-gray-500 hover:text-[#9B111E]'}`} data-testid="mobile-nav-cart">
        <div className="relative">
          <ShoppingCart className={`h-5 w-5 ${isActive('/cart') ? 'text-[#9B111E]' : ''}`} />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#9B111E] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium">{t('cart')}</span>
      </Link>
      <Link to="/orders" className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-lg transition-colors ${isActive('/orders') ? 'text-[#9B111E]' : 'text-gray-500 hover:text-[#9B111E]'}`} data-testid="mobile-nav-account">
        <User className={`h-5 w-5 ${isActive('/orders') ? 'text-[#9B111E]' : ''}`} />
        <span className="text-[10px] font-medium">{t('account')}</span>
      </Link>
    </nav>
  );
}
