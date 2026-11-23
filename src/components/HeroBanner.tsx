import { ArrowRight } from 'lucide-react';
import { BoutiqueImage } from './BoutiqueImage';

interface HeroBannerProps {
  onShopCollections: () => void;
}

export function HeroBanner({ onShopCollections }: HeroBannerProps) {
  return (
    <section className="border-b border-[#E5DCCB] bg-[#FAF7F2]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Editorial Copy Column */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6 py-2">
            <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-[#6B1D2F]">
              <span>காஞ்சிப் பட்டு</span>
              <span aria-hidden="true" className="text-[#C59B27]">·</span>
              <span>Bridal &amp; Festive Heritage Atelier</span>
            </div>

            <h1 className="font-serif text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.12] font-semibold text-[#1E1B18] text-balance">
              Heirloom Kanchipuram Silks Woven in Pure Zari
            </h1>

            <p className="text-[15px] sm:text-base leading-relaxed text-[#5C544D] max-w-[54ch]">
              Handloom Korvai bridal drapes, pure silk Aari Maggam blouses, and festive
              ensembles crafted by master weavers for auspicious beginnings.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={onShopCollections}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-[#FAF7F2] bg-[#6B1D2F] hover:bg-[#521422] transition-colors rounded-md whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C59B27]"
              >
                <span>Shop Collections</span>
                <ArrowRight className="w-4 h-4 text-[#DFC06B]" aria-hidden="true" />
              </button>

              <span className="text-xs font-medium text-[#5C544D]">
                Silk Mark Certified · Pan-India Insured Dispatch
              </span>
            </div>
          </div>

          {/* 16:9 Editorial Campaign Imagery */}
          <div className="lg:col-span-7">
            <div className="relative h-full min-h-[260px] lg:min-h-[420px] aspect-[16/9] w-full overflow-hidden rounded-lg border border-[#E5DCCB] bg-[#F2ECE1]">
              <BoutiqueImage
                src="/src/assets/images/hero_kanchipuram_bridal_1795447518249.jpg"
                alt="Royal South Indian bride draped in deep temple maroon Kanchipuram silk saree with antique gold zari border"
                fallbackTitle="Kaveri Bridal Collection"
                className="w-full h-full object-cover object-center"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1E1B18]/45 via-transparent to-transparent"
                aria-hidden="true"
              />
              <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-xs text-[#FAF7F2]">
                <span className="font-serif italic text-sm">Muhurtham Korvai Edit</span>
                <span className="text-[#DFC06B] font-medium">Kanchipuram · Chennai</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
