import React, { useState } from 'react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { Header } from './components/navigation/Header';
import { CustomerView } from './components/customer/CustomerView';
import { CartDrawer } from './components/customer/CartDrawer';
import { OrderSuccessModal } from './components/customer/OrderSuccessModal';
import { KitchenDisplaySystem } from './components/kds/KitchenDisplaySystem';
import { TableManagementView } from './components/tables/TableManagementView';
import { InventoryManagementView } from './components/inventory/InventoryManagementView';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { SplitBillModal } from './components/payment/SplitBillModal';
import { OfflineBanner } from './components/common/OfflineBanner';

const MainAppContent: React.FC = () => {
  const { currentView, setCurrentView } = useRestaurant();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null);
  const [splitBillOrderId, setSplitBillOrderId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-['Outfit'] antialiased selection:bg-amber-500 selection:text-neutral-950">
      {/* Offline Status & Outage Simulation Ribbon */}
      <OfflineBanner />

      {/* Primary Header with Navigation & Live Indicators */}
      <Header onOpenCart={() => setIsCartOpen(true)} />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-5">
        {currentView === 'customer' && (
          <CustomerView
            onOpenSplitBill={(orderId) => setSplitBillOrderId(orderId)}
          />
        )}

        {currentView === 'kds' && (
          <KitchenDisplaySystem />
        )}

        {currentView === 'tables' && (
          <TableManagementView />
        )}

        {currentView === 'inventory' && (
          <InventoryManagementView />
        )}

        {currentView === 'analytics' && (
          <AnalyticsDashboard />
        )}
      </main>

      {/* Modals & Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={(orderNum) => {
          setSuccessOrderNumber(orderNum);
        }}
      />

      <OrderSuccessModal
        orderNumber={successOrderNumber}
        onClose={() => setSuccessOrderNumber(null)}
        onViewKDS={() => {
          setSuccessOrderNumber(null);
          setCurrentView('kds');
        }}
      />

      {splitBillOrderId && (
        <SplitBillModal
          orderId={splitBillOrderId}
          onClose={() => setSplitBillOrderId(null)}
        />
      )}

      {/* Footer Branding */}
      <footer className="border-t border-neutral-900 bg-neutral-950/90 py-5 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Varhad Rasoi Amravati &bull; Rajkamal Chowk, Badnera Rd</span>
          <span className="text-[11px] text-neutral-400">
            Real-Time Kitchen Display &bull; Split-Bill Engine &bull; Offline Sync
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <RestaurantProvider>
      <MainAppContent />
    </RestaurantProvider>
  );
}
