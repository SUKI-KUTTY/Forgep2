import { useState } from 'react';
import { ShoppingBag, Check, Heart } from 'lucide-react';
import { formatINR } from '../lib/format';
import { CATEGORY_META, type Product } from '../types/boutique';
import { BoutiqueImage } from './BoutiqueImage';

interface ProductCardProps {
  product: Product;
  isWatchlisted: boolean;
  onToggleWatchlist: (productId: string) => void;
  onViewProduct: (productId: string) => void;
  onAddToBag: (product: Product, size: string) => void;
  onBuyNow: (product: Product, size: string) => void;
}

export function ProductCard({
  product,
  isWatchlisted,
  onToggleWatchlist,
  onViewProduct,
  onAddToBag,
  onBuyNow,
}: ProductCardProps) {
  const availableSizes = product.sizes.length > 0 ? product.sizes : ['Free Size'];
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0]);
  const [justAdded, setJustAdded] = useState(false);

  const catMeta = CATEGORY_META[product.category];

  const handleAdd = () => {
    if (!product.in_stock) return;
    onAddToBag(product, selectedSize);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <article className="group flex flex-col bg-[#FAF7F2] border border-[#E5DCCB] rounded-lg overflow-hidden transition-shadow duration-200 hover:shadow-md">
      {/* 4:3 Product Photography with smooth hover zoom & watchlist button */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F2ECE1]">
        <button
          type="button"
          onClick={() => onViewProduct(product.id)}
          aria-label={`View details and reviews for ${product.name}`}
          className="block w-full h-full cursor-pointer"
        >
          <BoutiqueImage
            src={product.image_url}
            alt={product.name}
            fallbackTitle={product.name}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        </button>

        <button
          type="button"
          onClick={() => onToggleWatchlist(product.id)}
          aria-label={isWatchlisted ? `Remove ${product.name} from watchlist` : `Add ${product.name} to watchlist`}
          className="absolute top-3 right-3 p-2 rounded-full bg-[#FAF7F2]/90 border border-[#E5DCCB] text-[#6B1D2F] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 ${isWatchlisted ? 'fill-[#6B1D2F] text-[#6B1D2F]' : ''}`}
            aria-hidden="true"
          />
        </button>

        {!product.in_stock && (
          <div className="pointer-events-none absolute inset-0 bg-[#1E1B18]/45 flex items-center justify-center">
            <span className="px-3.5 py-1.5 bg-[#FAF7F2] text-[#1E1B18] text-xs font-semibold tracking-wide rounded-sm">
              Currently Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5 space-y-3">
        {/* Clean Unboxed Bilingual English / Tamil Category Metadata */}
        <div className="flex items-center justify-between gap-2 text-xs text-[#5C544D]">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-medium text-[#6B1D2F]">{catMeta?.en || product.category}</span>
            <span aria-hidden="true" className="text-[#C59B27]">·</span>
            <span>{catMeta?.ta}</span>
          </div>
          <span className="shrink-0 text-[11px] font-medium text-[#5C544D]">
            {product.in_stock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onViewProduct(product.id)}
          className="text-left cursor-pointer"
        >
          <h3 className="font-serif text-lg font-semibold text-[#1E1B18] group-hover:text-[#6B1D2F] transition-colors leading-snug line-clamp-2">
            {product.name}
          </h3>
        </button>

        <p className="text-xs leading-relaxed text-[#5C544D] line-clamp-2 flex-1">
          {product.description}
        </p>

        {/* Price & Size Selector */}
        <div className="pt-2 border-t border-[#E5DCCB] flex items-center justify-between gap-3">
          <span className="text-base font-bold text-[#1E1B18] tabular-nums">
            {formatINR(product.price)}
          </span>

          <div className="flex items-center gap-1 flex-wrap justify-end" role="group" aria-label="Select size">
            {availableSizes.map((size) => {
              const active = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  disabled={!product.in_stock}
                  onClick={() => setSelectedSize(size)}
                  className={`px-2 py-1 text-[11px] font-medium rounded-sm border transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
                    active
                      ? 'bg-[#6B1D2F] text-[#FAF7F2] border-[#6B1D2F]'
                      : 'bg-[#FAF7F2] text-[#5C544D] border-[#E5DCCB] hover:border-[#6B1D2F]'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={!product.in_stock}
            onClick={handleAdd}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold border border-[#6B1D2F] text-[#6B1D2F] hover:bg-[#6B1D2F] hover:text-[#FAF7F2] transition-colors rounded-md whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add to Bag</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={!product.in_stock}
            onClick={() => onBuyNow(product, selectedSize)}
            className="inline-flex items-center justify-center px-3 py-2.5 text-xs font-semibold bg-[#6B1D2F] text-[#FAF7F2] hover:bg-[#521422] transition-colors rounded-md whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Buy Now
          </button>
        </div>
      </div>
    </article>
  );
}
