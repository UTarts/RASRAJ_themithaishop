import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const WEIGHT_MAP = { '250g': 'g250', '500g': 'g500', '1kg': 'g1000' };

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rr_cart') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('rr_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product, weight, qty = 1) => {
    const price = product.prices?.[WEIGHT_MAP[weight]] || 0;
    setItems(prev => {
      const idx = prev.findIndex(i => i.product_id === product.id && i.weight === weight);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        product_name_hi: product.name_hi,
        weight, quantity: qty, price,
        image: product.images?.[0] || ''
      }];
    });
  };

  const updateItem = (product_id, weight, quantity) => {
    if (quantity <= 0) { removeItem(product_id, weight); return; }
    setItems(prev => prev.map(i => i.product_id === product_id && i.weight === weight ? { ...i, quantity } : i));
  };

  const removeItem = (product_id, weight) => {
    setItems(prev => prev.filter(i => !(i.product_id === product_id && i.weight === weight)));
  };

  const clearCart = () => setItems([]);

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateItem, removeItem, clearCart, cartCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
};
