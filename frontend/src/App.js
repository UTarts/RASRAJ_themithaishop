import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Login from "@/pages/Login";
import OrderHistory from "@/pages/OrderHistory";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminOrders from "@/pages/admin/AdminOrders";
import DeliveryPanel from "@/pages/delivery/DeliveryPanel";

import "./App.css";

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />

              {/* Customer Protected */}
              <Route path="/checkout" element={
                <ProtectedRoute><Checkout /></ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute><OrderHistory /></ProtectedRoute>
              } />

              {/* Admin Protected */}
              <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
              } />
              <Route path="/admin/products" element={
                <ProtectedRoute roles={['admin']}><AdminProducts /></ProtectedRoute>
              } />
              <Route path="/admin/categories" element={
                <ProtectedRoute roles={['admin']}><AdminCategories /></ProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>
              } />

              {/* Delivery Partner Protected */}
              <Route path="/delivery" element={
                <ProtectedRoute roles={['delivery_partner', 'admin']}><DeliveryPanel /></ProtectedRoute>
              } />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#fff',
                  border: '2px solid #E6D5BC',
                  color: '#2A2A2A',
                  fontFamily: 'Manrope, sans-serif',
                  borderRadius: '12px',
                },
              }}
              richColors
            />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
