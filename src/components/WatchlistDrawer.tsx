import { Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatINR } from '../lib/format';
import type { Product } from '../types/boutique';
import { BoutiqueImage } from './BoutiqueImage';

interface WatchlistDrawerProps {
  open: boolean;
  items: Product[];
  onClose: () => void;
  onRemoveItem: (productId: string) => void;
  onMoveToBag: (product: Product) => void;
  onViewProduct: (productId: string) => void;
}

export function WatchlistDrawer({
  open,
  items,
  onClose,
  onRemoveItem,
  onMoveToBag,
  onViewProduct,
}: WatchlistDrawerProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#1E1B18]/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Saved Watchlist"
    >
      <div className="flex-1" onClick={onClose} aria-hidden="true" />
      <aside className="w-full max-w-md bg-[#FAF7F2] h-full flex flex-col border-l border-[#E5DCCB] shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5DCCB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Heart className="w-5 h-5 text-[#6B1D2F]" aria-hidden="true" />
            <h2 className="font-serif text-xl font-semibold text-[#1E1B18]">
              Your Watchlist
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close watchlist"
            className="p-2 text-[#5C544D] hover:text-[#1E1B18] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Watchlisted Garments */}
        <div className="flex-1 overflow-y-auto px-6 py-5 divide-y divide-[#E5DCCB]">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
              <Heart className="w-10 h-10 text-[#C59B27]/70" aria-hidden="true" />
              <p className="font-serif text-lg text-[#1E1B18]">Your watchlist is empty</p>
              <p className="text-xs text-[#5C544D] max-w-[28ch]">
                Tap the heart icon on any Kanchipuram weave or bridal piece to save it for later.
              </p>
            </div>
          ) : (
            items.map((product) => (
              <div key={product.id} className="py-4 first:pt-0 flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewProduct(product.id);
                  }}
                  className="w-20 h-20 rounded-md overflow-hidden border border-[#E5DCCB] bg-[#F2ECE1] shrink-0 cursor-pointer"
                >
                  <BoutiqueImage
                    src={product.image_url}
                    alt={product.name}
                    fallbackTitle={product.name}
                    className="w-full h-full object-cover"
                  />
                </button>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onViewProduct(product.id);
                        }}
                        className="font-serif text-sm font-semibold text-[#1E1B18] hover:text-[#6B1D2F] text-left line-clamp-1 cursor-pointer"
                      >
                        {product.name}
                      </button>
                      <p className="text-xs text-[#5C544D] mt-0.5 tabular-nums font-medium">
                        {formatINR(product.price)} ·{' '}
                        <span className={product.in_stock ? 'text-[#215A36]' : 'text-[#6B1D2F]'}>
                          {product.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(product.id)}
                      aria-label={`Remove ${product.name} from watchlist`}
                      className="p-1 text-[#5C544D] hover:text-[#6B1D2F] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!product.in_stock}
                      onClick={() => onMoveToBag(product)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FAF7F2] bg-[#6B1D2F] hover:bg-[#521422] rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Move to Bag</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onViewProduct(product.id);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-[#1E1B18] border border-[#E5DCCB] hover:border-[#6B1D2F] rounded-md transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
