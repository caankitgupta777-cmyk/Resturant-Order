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
import { BillPaymentModal } from './components/payment/SplitBillModal';
import { OfflineBanner } from './components/common/OfflineBanner';
import { RestaurantSettingsModal } from './components/settings/RestaurantSettingsModal';
import { StaffPinLockModal } from './components/auth/StaffPinLockModal';
import { ManagerVoidAuthModal } from './components/auth/ManagerVoidAuthModal';
import { CashRegisterModal } from './components/register/CashRegisterModal';
import { AuditLogViewerModal } from './components/audit/AuditLogViewerModal';
import { TenantOnboardingModal } from './components/tenant/TenantOnboardingModal';
import { ThermalPrinterModal } from './components/hardware/ThermalPrinterModal';
import { SubscriptionLicenseModal } from './components/saas/SubscriptionLicenseModal';
import { Sparkles } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    isSettingsOpen,
    setIsSettingsOpen,
    restaurantSettings,
    isScreenLocked,
  } = useRestaurant();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null);
  const [billPaymentOrderId, setBillPaymentOrderId] = useState<string | null>(null);

  // Commercial 6-Phase Modals State
  const [isPinLockOpen, setIsPinLockOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'business' | 'tax' | 'firebase' | 'menu' | 'onboarding'>('business');
  const [voidOrderId, setVoidOrderId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-['Outfit'] antialiased selection:bg-amber-500 selection:text-neutral-950">
      {/* Offline Status & Outage Simulation Ribbon */}
      <OfflineBanner />

      {/* Primary Header with Navigation & Commercial Phase Controls */}
      <Header
        onOpenCart={() => setIsCartOpen(true)}
        onOpenPinLock={() => setIsPinLockOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenAuditLogs={() => setIsAuditModalOpen(true)}
        onOpenTenants={() => setIsTenantModalOpen(true)}
        onOpenPrinter={() => setIsPrinterModalOpen(true)}
        onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
        onOpenOnboarding={() => {
          setSettingsTab('onboarding');
          setIsSettingsOpen(true);
        }}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-5">
        {currentView === 'customer' && (
          <CustomerView
            onOpenSplitBill={(orderId) => setBillPaymentOrderId(orderId)}
            onVoidOrder={(orderId) => setVoidOrderId(orderId)}
          />
        )}

        {currentView === 'kds' && (
          <KitchenDisplaySystem
            onVoidOrder={(orderId) => setVoidOrderId(orderId)}
          />
        )}

        {currentView === 'tables' && (
          <TableManagementView
            onOpenSplitBill={(orderId) => setBillPaymentOrderId(orderId)}
          />
        )}

        {currentView === 'inventory' && (
          <InventoryManagementView />
        )}

        {currentView === 'analytics' && (
          <AnalyticsDashboard
            onOpenInvoice={(orderId) => setBillPaymentOrderId(orderId)}
          />
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

      {billPaymentOrderId && (
        <BillPaymentModal
          orderId={billPaymentOrderId}
          onClose={() => setBillPaymentOrderId(null)}
        />
      )}

      {/* Configurable Restaurant & Firebase Multi-Device Sync Modal */}
      <RestaurantSettingsModal
        isOpen={isSettingsOpen}
        initialTab={settingsTab}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Phase 1: Staff 4-Digit PIN Lock Modal */}
      <StaffPinLockModal
        isOpen={isPinLockOpen || isScreenLocked}
        onClose={() => setIsPinLockOpen(false)}
      />

      {/* Phase 2: Manager Order Void Authorization Modal */}
      {voidOrderId && (
        <ManagerVoidAuthModal
          orderId={voidOrderId}
          onClose={() => setVoidOrderId(null)}
        />
      )}

      {/* Phase 2: Security & Fraud Audit Trail Modal */}
      <AuditLogViewerModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {/* Phase 3: Shift Management, Cash Register & Z-Report Modal */}
      <CashRegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />

      {/* Phase 4: Multi-Tenant Restaurant Branch Onboarding Modal */}
      <TenantOnboardingModal
        isOpen={isTenantModalOpen}
        onClose={() => setIsTenantModalOpen(false)}
        onOpenClientWizard={() => {
          setSettingsTab('onboarding');
          setIsSettingsOpen(true);
        }}
      />

      {/* Phase 5: Hardware & Thermal Printer Modal */}
      <ThermalPrinterModal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
      />

      {/* Phase 6: Commercial SaaS Subscription & Resale Plans Modal */}
      <SubscriptionLicenseModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />

      {/* Floating Action Button for Client Onboarding & DB Reset */}
      <div className="fixed bottom-5 right-5 z-40 no-print">
        <button
          type="button"
          onClick={() => {
            setSettingsTab('onboarding');
            setIsSettingsOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-extrabold text-xs sm:text-sm rounded-full shadow-2xl border-2 border-amber-300 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Open Client Onboarding & Database Reset Wizard"
        >
          <Sparkles className="w-4 h-4 fill-neutral-950" />
          <span>🚀 Onboard / Reset DB</span>
        </button>
      </div>

      {/* Footer Branding */}
      <footer className="border-t border-neutral-900 bg-neutral-950/90 py-5 text-center text-xs text-neutral-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} {restaurantSettings.restaurantName} &bull; {restaurantSettings.address}, {restaurantSettings.city}</span>
          <span className="text-[11px] text-neutral-400">
            Commercial Multi-Terminal Restaurant POS &bull; Shift Z-Report &bull; PIN-Protected RBAC
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
