import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CustomerView } from './components/customer/CustomerView';
import { SellerDashboard } from './components/seller/SellerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AprioriMathModal } from './components/AprioriMathModal';
import { LoginModal } from './components/LoginModal';
import { ErrorBoundary } from './components/ErrorBoundary';

const MainLayout: React.FC = () => {
  const { currentRole } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2D1217]">
      {/* Universal Navigation Header */}
      <Header />

      {/* Main Dynamic View Area */}
      <main className="flex-1">
        {currentRole === 'customer' && <CustomerView />}
        {currentRole === 'seller' && <SellerDashboard />}
        {currentRole === 'admin' && <AdminDashboard />}
      </main>

      {/* Boutique Footer */}
      <Footer />

      {/* Global Interactive Overlays */}
      <CartDrawer />
      <CheckoutModal />
      <ProductDetailModal />
      <AprioriMathModal />
      <LoginModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <ErrorBoundary>
        <MainLayout />
      </ErrorBoundary>
    </AppProvider>
  );
}
