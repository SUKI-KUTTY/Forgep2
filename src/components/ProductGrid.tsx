import { Search } from 'lucide-react';
import { CATEGORY_META, type Product, type ProductCategory } from '../types/boutique';
import { ProductCard } from './ProductCard';

export type CategoryFilter = 'ALL' | ProductCategory;

const FILTER_OPTIONS: Array<{ key: CategoryFilter; en: string; ta: string }> = [
  { key: 'ALL', en: 'All Collections', ta: 'அனைத்தும்' },
  { key: 'Bridal Silks', en: CATEGORY_META['Bridal Silks'].en, ta: CATEGORY_META['Bridal Silks'].ta },
  { key: 'Designer Kurtis', en: CATEGORY_META['Designer Kurtis'].en, ta: CATEGORY_META['Designer Kurtis'].ta },
  { key: 'Aari Blouses', en: CATEGORY_META['Aari Blouses'].en, ta: CATEGORY_META['Aari Blouses'].ta },
  { key: 'Lehengas', en: CATEGORY_META['Lehengas'].en, ta: CATEGORY_META['Lehengas'].ta },
];

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  activeCategory: CategoryFilter;
  onCategoryChange: (cat: CategoryFilter) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  watchlistIds: string[];
  onToggleWatchlist: (productId: string) => void;
  onViewProduct: (productId: string) => void;
  onAddToBag: (product: Product, size: string) => void;
  onBuyNow: (product: Product, size: string) => void;
}

export function ProductGrid({
  products,
  loading,
  error,
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  watchlistIds,
  onToggleWatchlist,
  onViewProduct,
  onAddToBag,
  onBuyNow,
}: ProductGridProps) {
  const filtered = products.filter((p) => {
    const matchesCat = activeCategory === 'ALL' || p.category === activeCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <section id="collections" className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 lg:py-16">
      {/* Section Header & Bilingual Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E5DCCB]">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[#6B1D2F]">
            {activeCategory === 'ALL'
              ? 'Curated Boutique Catalog · பாரம்பரிய சேகரிப்பு'
              : `${CATEGORY_META[activeCategory].en} · ${CATEGORY_META[activeCategory].ta}`}
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1E1B18]">
            Signature Weaves &amp; Bridal Couture
          </h2>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search
            className="w-4 h-4 text-[#5C544D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search silks, Aari, kurtis..."
            aria-label="Search boutique collections"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FAF7F2] border border-[#E5DCCB] rounded-md text-[#1E1B18] placeholder:text-[#5C544D]/70 focus:outline-none focus:border-[#6B1D2F]"
          />
        </div>
      </div>

      {/* Interactive Category Filter Controls */}
      <div
        className="flex items-center gap-2 overflow-x-auto py-5 no-scrollbar"
        role="tablist"
        aria-label="Product category filters"
      >
        {FILTER_OPTIONS.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onCategoryChange(cat.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#6B1D2F] text-[#FAF7F2] border-[#6B1D2F]'
                  : 'bg-[#F2ECE1]/70 text-[#1E1B18] border-[#E5DCCB] hover:border-[#6B1D2F]'
              }`}
            >
              <span>{cat.en}</span>
              <span className={isActive ? 'text-[#DFC06B]' : 'text-[#5C544D]'}>{cat.ta}</span>
            </button>
          );
        })}
      </div>

      {/* States: Loading / Error / Empty / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pt-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-[420px] rounded-lg border border-[#E5DCCB] bg-[#F2ECE1]/60 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="py-16 text-center border border-[#E5DCCB] rounded-lg bg-[#F2ECE1]/40">
          <p className="text-sm font-medium text-[#6B1D2F]">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border border-[#E5DCCB] rounded-lg bg-[#F2ECE1]/30 space-y-3">
          <p className="font-serif text-lg text-[#1E1B18]">No garments match this selection</p>
          <p className="text-xs text-[#5C544D]">
            Try clearing your search or exploring all boutique collections.
          </p>
          <button
            type="button"
            onClick={() => {
              onCategoryChange('ALL');
              onSearchChange('');
            }}
            className="px-4 py-2 text-xs font-semibold text-[#6B1D2F] border border-[#6B1D2F] rounded-md hover:bg-[#6B1D2F] hover:text-[#FAF7F2] transition-colors cursor-pointer"
          >
            View All Collections
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pt-2">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWatchlisted={watchlistIds.includes(product.id)}
              onToggleWatchlist={onToggleWatchlist}
              onViewProduct={onViewProduct}
              onAddToBag={onAddToBag}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      )}
    </section>
  );
}
