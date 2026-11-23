import React, { useState } from 'react';
import { CheckCircle2, Minus, Plus, Trash2, X } from 'lucide-react';
import type { MakeupShade, UserOrder } from '../data/makeupCatalog';

export interface BagItem {
  shade: MakeupShade;
  finishLabel: string;
  quantity: number;
}

interface VanityBagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: BagItem[];
  onUpdateQuantity: (shadeId: string, delta: number) => void;
  onRemoveItem: (shadeId: string) => void;
  onSubmitOrder: (customerName: string, customerEmail: string) => Promise<UserOrder>;
}

export const VanityBagDrawer: React.FC<VanityBagDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onSubmitOrder,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<UserOrder | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.shade.price * item.quantity,
    0
  );

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim()) {
      setSubmitError('Please enter your name and email address.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const order = await onSubmitOrder(customerName.trim(), customerEmail.trim());
      setConfirmedOrder(order);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : 'Unable to place order right now.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setConfirmedOrder(null);
    setSubmitError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-[#191615]/40 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      <aside className="relative z-10 w-full max-w-md bg-[#FAF8F6] h-full flex flex-col justify-between border-l border-[#191615]/12 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#191615]/10">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#191615]">
              Vanity Bag
            </h2>
            <p className="text-xs text-[#6E6560]">
              {items.reduce((acc, i) => acc + i.quantity, 0)} selected items
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close vanity bag"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#5C534E] hover:text-[#191615] hover:bg-[#EFEAE4] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {confirmedOrder ? (
            <div className="py-12 flex flex-col items-center text-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-[#191615]" />
              <h3 className="font-display text-2xl font-semibold text-[#191615]">
                Order #{confirmedOrder.id} Confirmed
              </h3>
              <p className="text-sm text-[#5C534E] max-w-xs leading-relaxed">
                Recorded for {confirmedOrder.customerName} (${confirmedOrder.total}). Track status in your User Page or Admin Console.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-4 px-5 py-2.5 bg-[#191615] text-[#FAF8F6] text-xs font-medium rounded-lg cursor-pointer"
              >
                Return to Studio
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-display text-2xl text-[#191615] mb-2">
                Your Vanity Bag is Empty
              </p>
              <p className="text-xs text-[#6E6560] max-w-xs mx-auto leading-relaxed">
                Test shades in the live mirror and add your favorite foundation, lipstick, eyeliner, kajal, eyeshadow, blush, or highlighter combinations here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[#191615]/10">
              {items.map((item) => (
                <div
                  key={item.shade.id}
                  className="py-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className="w-10 h-10 rounded-full shrink-0 border border-[#191615]/15"
                      style={{ backgroundColor: item.shade.hex }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs text-[#6E6560] capitalize">
                        {item.shade.brand} · {item.finishLabel}
                      </div>
                      <div className="text-sm font-semibold text-[#191615] truncate">
                        {item.shade.name}
                      </div>
                      <div className="text-xs font-mono tabular-nums text-[#5C534E] mt-0.5">
                        ${item.shade.price}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-[#191615]/15 rounded-md bg-white">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => onUpdateQuantity(item.shade.id, -1)}
                        className="w-7 h-7 flex items-center justify-center text-[#5C534E] hover:text-[#191615] cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-mono tabular-nums text-[#191615]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => onUpdateQuantity(item.shade.id, 1)}
                        className="w-7 h-7 flex items-center justify-center text-[#5C534E] hover:text-[#191615] cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={() => onRemoveItem(item.shade.id)}
                      className="w-7 h-7 flex items-center justify-center text-[#8E837D] hover:text-[#8B2635] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && !confirmedOrder && (
          <form
            onSubmit={handleCheckout}
            className="p-6 border-t border-[#191615]/10 bg-white flex flex-col gap-3"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#5C534E]">Subtotal</span>
              <span className="font-mono tabular-nums font-semibold text-[#191615] text-base">
                ${subtotal}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your Full Name"
                className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-xs"
              />
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Email for Order Tracking"
                className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-xs"
              />
            </div>

            {submitError && (
              <p className="text-xs text-[#8B2635]">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#8B2635] hover:bg-[#6E1D2A] disabled:opacity-50 text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Submitting Order…' : 'Complete Atelier Order'}
            </button>
          </form>
        )}
      </aside>
    </div>
  );
};
