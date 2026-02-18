import { createContext, useContext, useState } from "react";

const T = {
  en: {
    home: 'Home', shop: 'Shop', cart: 'Cart', account: 'Account', search: 'Search sweets...',
    tagline: 'The Taste of Tradition', usp: 'We Do Not Weight Box',
    usp_sub: 'Pure, honest, premium quality — guaranteed every time',
    shopNow: 'Shop Now', viewAll: 'View All', addToCart: 'Add to Cart', buyNow: 'Buy Now',
    inStock: 'In Stock', outOfStock: 'Out of Stock',
    featured: 'Featured', bestseller: 'Bestseller', premium: 'Premium', new: 'New', seasonal: 'Seasonal',
    yourCart: 'Your Cart', emptyCart: 'Your cart is empty', continueShopping: 'Continue Shopping',
    subtotal: 'Subtotal', deliveryCharge: 'Delivery', discount: 'Discount', total: 'Total',
    checkout: 'Proceed to Checkout', couponCode: 'Coupon Code', apply: 'Apply',
    freeDelivery: 'Free delivery above ₹500',
    deliveryAddress: 'Delivery Address', deliveryType: 'Delivery Type',
    homeDelivery: 'Home Delivery', storePickup: 'Store Pickup',
    paymentMethod: 'Payment Method', upi: 'UPI / PhonePe / GPay', card: 'Debit / Credit Card', cod: 'Cash on Delivery',
    placeOrder: 'Place Order', orderPlaced: 'Order Placed Successfully!',
    orderTracking: 'Track Order',
    placed: 'Order Placed', accepted: 'Accepted', preparing: 'Preparing',
    packed: 'Packed', outForDelivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled',
    login: 'Login', register: 'Register', logout: 'Logout',
    name: 'Full Name', email: 'Email', password: 'Password', phone: 'Phone',
    guestCheckout: 'Continue as Guest', orLogin: 'Already have an account?',
    myOrders: 'My Orders', profile: 'Profile', addresses: 'Addresses', reorder: 'Reorder',
    storeTitle: 'Visit Us', storeAddress: 'Amethi, Uttar Pradesh', storeHours: 'Mon–Sun: 8 AM – 10 PM',
    callUs: 'Call Us', language: 'हिंदी', categories: 'Categories',
    ingredients: 'Ingredients', shelfLife: 'Shelf Life', description: 'Description',
    weight: 'Select Weight', qty: 'Qty', relatedProducts: 'You May Also Like',
    fullName: 'Full Name', addressLine: 'Address', city: 'City', pincode: 'Pincode',
    orderNumber: 'Order No.', orderDate: 'Date', orderStatus: 'Status', orderTotal: 'Total',
    noOrders: 'No orders yet', noOrdersHint: 'Place your first order!',
    adminDashboard: 'Dashboard', adminProducts: 'Products', adminCategories: 'Categories',
    adminOrders: 'Orders', adminCustomers: 'Customers',
    todayOrders: "Today's Orders", totalRevenue: 'Total Revenue', totalProducts: 'Total Products', totalUsers: 'Total Users',
    addProduct: 'Add Product', editProduct: 'Edit Product', deleteProduct: 'Delete Product',
    productName: 'Product Name', category: 'Category', price: 'Price', stockStatus: 'Stock Status',
    availableCoupons: 'Available Coupons',
  },
  hi: {
    home: 'होम', shop: 'शॉप', cart: 'कार्ट', account: 'अकाउंट', search: 'मिठाई खोजें...',
    tagline: 'परंपरा का स्वाद', usp: 'हम डिब्बा नहीं तोलते',
    usp_sub: 'शुद्ध, ईमानदार, प्रीमियम गुणवत्ता — हर बार गारंटी',
    shopNow: 'अभी खरीदें', viewAll: 'सभी देखें', addToCart: 'कार्ट में जोड़ें', buyNow: 'अभी खरीदें',
    inStock: 'उपलब्ध', outOfStock: 'उपलब्ध नहीं',
    featured: 'विशेष', bestseller: 'बेस्टसेलर', premium: 'प्रीमियम', new: 'नया', seasonal: 'मौसमी',
    yourCart: 'आपका कार्ट', emptyCart: 'कार्ट खाली है', continueShopping: 'खरीदारी जारी रखें',
    subtotal: 'उप-कुल', deliveryCharge: 'डिलीवरी', discount: 'छूट', total: 'कुल',
    checkout: 'चेकआउट करें', couponCode: 'कूपन कोड', apply: 'लगाएं',
    freeDelivery: '₹500 से ऊपर मुफ्त डिलीवरी',
    deliveryAddress: 'डिलीवरी पता', deliveryType: 'डिलीवरी प्रकार',
    homeDelivery: 'होम डिलीवरी', storePickup: 'स्टोर से लें',
    paymentMethod: 'भुगतान विधि', upi: 'UPI / PhonePe / GPay', card: 'डेबिट / क्रेडिट कार्ड', cod: 'कैश ऑन डिलीवरी',
    placeOrder: 'ऑर्डर करें', orderPlaced: 'ऑर्डर सफलतापूर्वक हो गया!',
    orderTracking: 'ऑर्डर ट्रैक करें',
    placed: 'ऑर्डर हुआ', accepted: 'स्वीकृत', preparing: 'तैयार हो रहा',
    packed: 'पैक हो गया', outForDelivery: 'डिलीवरी पर', delivered: 'डिलीवर', cancelled: 'रद्द',
    login: 'लॉगिन', register: 'रजिस्टर', logout: 'लॉगआउट',
    name: 'पूरा नाम', email: 'ईमेल', password: 'पासवर्ड', phone: 'फोन',
    guestCheckout: 'अतिथि के रूप में जारी रखें', orLogin: 'पहले से अकाउंट है?',
    myOrders: 'मेरे ऑर्डर', profile: 'प्रोफाइल', addresses: 'पते', reorder: 'फिर से ऑर्डर',
    storeTitle: 'हमसे मिलें', storeAddress: 'अमेठी, उत्तर प्रदेश', storeHours: 'सोम–रवि: सुबह 8 – रात 10 बजे',
    callUs: 'हमें कॉल करें', language: 'English', categories: 'श्रेणियाँ',
    ingredients: 'सामग्री', shelfLife: 'भंडारण समय', description: 'विवरण',
    weight: 'वजन चुनें', qty: 'मात्रा', relatedProducts: 'आपको पसंद आएगा',
    fullName: 'पूरा नाम', addressLine: 'पता', city: 'शहर', pincode: 'पिनकोड',
    orderNumber: 'ऑर्डर नं.', orderDate: 'तारीख', orderStatus: 'स्थिति', orderTotal: 'कुल',
    noOrders: 'कोई ऑर्डर नहीं', noOrdersHint: 'अपना पहला ऑर्डर दें!',
    adminDashboard: 'डैशबोर्ड', adminProducts: 'उत्पाद', adminCategories: 'श्रेणियाँ',
    adminOrders: 'ऑर्डर', adminCustomers: 'ग्राहक',
    todayOrders: 'आज के ऑर्डर', totalRevenue: 'कुल राजस्व', totalProducts: 'कुल उत्पाद', totalUsers: 'कुल उपयोगकर्ता',
    addProduct: 'उत्पाद जोड़ें', editProduct: 'उत्पाद संपादित करें', deleteProduct: 'उत्पाद हटाएं',
    productName: 'उत्पाद का नाम', category: 'श्रेणी', price: 'मूल्य', stockStatus: 'स्टॉक स्थिति',
    availableCoupons: 'उपलब्ध कूपन',
  }
};

const LanguageContext = createContext(null);
export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('rr_lang') || 'en');

  const toggleLanguage = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    localStorage.setItem('rr_lang', next);
  };

  const t = (key) => T[lang]?.[key] || T['en']?.[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
