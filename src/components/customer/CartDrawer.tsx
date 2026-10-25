import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ChefHat,
  WifiOff,
  AlertCircle,
  Mail,
  User,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderNumber: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,
    customerTableNumber,
    placeOrder,
    isOnline,
    restaurantSettings,
  } = useRestaurant();

  const [customerName, setCustomerName] = useState('Ankit Gupta');
  const [customerEmail, setCustomerEmail] = useState('caankitgupta777@gmail.com');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const cgst = Number(((cartTotal * restaurantSettings.cgstRate) / 100).toFixed(2));
  const sgst = Number(((cartTotal * restaurantSettings.sgstRate) / 100).toFixed(2));
  const serviceCharge = restaurantSettings.serviceChargeRate > 0
    ? Number(((cartTotal * restaurantSettings.serviceChargeRate) / 100).toFixed(2))
    : 0;
  const grandTotal = Math.round(cartTotal + cgst + sgst + serviceCharge);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await placeOrder(customerName, customerEmail, orderNotes);
      if (res.success && res.order) {
        onOrderSuccess(res.order.orderNumber);
        onClose();
      } else {
        setErrorMessage(res.message || 'Failed to place order.');
      }
    } catch {
      setErrorMessage('Unexpected error placing order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900 border-l border-neutral-800 h-full flex flex-col justify-between shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white font-['Outfit']">
                Table #{customerTableNumber} Order Tray
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Direct Kitchen Display dispatch
            </p>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-neutral-800"
                title="Clear tray"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isOnline && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2">
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Offline Protection:</strong> Order will be queued locally on this device and synced directly to KDS once network re-establishes.
              </div>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="py-16 text-center text-neutral-500 space-y-2">
              <ChefHat className="w-12 h-12 mx-auto stroke-1 text-neutral-600" />
              <p className="text-sm font-medium text-neutral-300">Your order tray is empty</p>
              <p className="text-xs text-neutral-500">
                Select items from the menu to build your table order.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/80">
              {cart.map((cartItem) => (
                <div key={cartItem.item.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${cartItem.item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <h4 className="font-semibold text-xs text-neutral-100">
                        {cartItem.item.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-amber-400/90 font-serif">
                      {cartItem.item.localName}
                    </p>
                    <p className="text-xs font-bold text-neutral-300 font-mono">
                      {restaurantSettings.currencySymbol}{cartItem.item.price} &bull; <span className="text-white">{restaurantSettings.currencySymbol}{cartItem.item.price * cartItem.quantity}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-neutral-800 border border-neutral-700 rounded-lg p-1">
                      <button
                        onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity - 1)}
                        className="w-6 h-6 rounded bg-neutral-700 text-neutral-300 flex items-center justify-center hover:bg-neutral-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center text-xs font-bold text-amber-400">
                        {cartItem.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity + 1)}
                        className="w-6 h-6 rounded bg-amber-500 text-neutral-950 flex items-center justify-center font-bold hover:bg-amber-400"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(cartItem.item.id)}
                      className="text-neutral-500 hover:text-red-400 p-1"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Customer Details & Chef Notes (if cart has items) */}
          {cart.length > 0 && (
            <div className="pt-3 border-t border-neutral-800 space-y-3">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Guest &amp; Kitchen Instructions
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-400 flex items-center gap-1 mb-1">
                    <User className="w-2.5 h-2.5" /> Guest Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Guest name"
                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 flex items-center gap-1 mb-1">
                    <Mail className="w-2.5 h-2.5" /> Email (Receipt record)
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">
                  Special Cooking Instructions for Kitchen Line
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Notes for kitchen station..."
                  rows={2}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Billing Breakdown and Send to KDS button */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-neutral-800 bg-neutral-950/80 space-y-3">
            <div className="space-y-1.5 text-xs text-neutral-400">
              <div className="flex justify-between">
                <span>Items Subtotal ({cartCount})</span>
                <span className="text-white font-mono">{restaurantSettings.currencySymbol}{cartTotal}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>CGST ({restaurantSettings.cgstRate}%)</span>
                <span className="font-mono">{restaurantSettings.currencySymbol}{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>SGST ({restaurantSettings.sgstRate}%)</span>
                <span className="font-mono">{restaurantSettings.currencySymbol}{sgst.toFixed(2)}</span>
              </div>
              {serviceCharge > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span>Service Charge ({restaurantSettings.serviceChargeRate}%)</span>
                  <span className="font-mono">{restaurantSettings.currencySymbol}{serviceCharge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-neutral-800">
                <span>Estimated Total</span>
                <span className="text-amber-400 text-base font-mono">{restaurantSettings.currencySymbol}{grandTotal}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black rounded-xl text-sm shadow-xl shadow-amber-950/40 transition disabled:opacity-50"
            >
              <ChefHat className="w-4 h-4" />
              <span>{isSubmitting ? 'Routing to Kitchen...' : `Send to Kitchen (${cartCount} items)`}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
