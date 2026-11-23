import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatINR } from '../lib/format';
import type { CartItem } from '../types/boutique';
import { BoutiqueImage } from './BoutiqueImage';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQty: (productId: string, size: string, delta: number) => void;
  onRemoveItem: (productId: string, size: string) => void;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  open,
  items,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onProceedToCheckout,
}: CartDrawerProps) {
  if (!open) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#1E1B18]/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      <div className="flex-1" onClick={onClose} aria-hidden="true" />
      <aside className="w-full max-w-md bg-[#FAF7F2] h-full flex flex-col border-l border-[#E5DCCB] shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5DCCB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#6B1D2F]" aria-hidden="true" />
            <h2 className="font-serif text-xl font-semibold text-[#1E1B18]">
              Your Silk Bag
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shopping bag"
            className="p-2 text-[#5C544D] hover:text-[#1E1B18] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bag Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5 divide-y divide-[#E5DCCB]">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
              <ShoppingBag className="w-10 h-10 text-[#C59B27]/70" aria-hidden="true" />
              <p className="font-serif text-lg text-[#1E1B18]">Your bag is currently empty</p>
              <p className="text-xs text-[#5C544D] max-w-[26ch]">
                Explore our handwoven Kanchipuram silks, Aari blouses, and bridal lehengas.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.product.id}-${item.size}`}
                className="py-4 first:pt-0 flex gap-4"
              >
                <div className="w-20 h-20 rounded-md overflow-hidden border border-[#E5DCCB] bg-[#F2ECE1] shrink-0">
                  <BoutiqueImage
                    src={item.product.image_url}
                    alt={item.product.name}
                    fallbackTitle={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-sm font-semibold text-[#1E1B18] line-clamp-1">
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-[#5C544D] mt-0.5">
                        Size: <span className="font-medium text-[#1E1B18]">{item.size}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.product.id, item.size)}
                      aria-label={`Remove ${item.product.name}`}
                      className="p-1 text-[#5C544D] hover:text-[#6B1D2F] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="inline-flex items-center border border-[#E5DCCB] rounded-md bg-[#FAF7F2]">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.product.id, item.size, -1)}
                        aria-label="Decrease quantity"
                        className="p-1.5 text-[#5C544D] hover:text-[#1E1B18] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-semibold tabular-nums text-[#1E1B18]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.product.id, item.size, 1)}
                        aria-label="Increase quantity"
                        className="p-1.5 text-[#5C544D] hover:text-[#1E1B18] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-sm font-semibold tabular-nums text-[#1E1B18]">
                      {formatINR(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Subtotal & Checkout CTA */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-[#E5DCCB] bg-[#F2ECE1]/60 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#5C544D]">Complimentary Insured Shipping</span>
              <span className="font-medium text-[#6B1D2F]">Free</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-serif text-base font-semibold text-[#1E1B18]">Subtotal</span>
              <span className="text-lg font-bold tabular-nums text-[#1E1B18]">
                {formatINR(subtotal)}
              </span>
            </div>
            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full py-3.5 px-5 text-sm font-semibold text-[#FAF7F2] bg-[#6B1D2F] hover:bg-[#521422] transition-colors rounded-md cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C59B27]"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
