export function CraftsmanshipSection() {
  return (
    <section className="border-t border-[#E5DCCB] bg-[#F2ECE1]/65">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-5 space-y-3">
            <p className="text-xs font-medium text-[#6B1D2F]">
              கைத்தறி பாரம்பரியம் · Loom Craftsmanship
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1E1B18] text-balance">
              Direct From Master Weavers of Kanchipuram
            </h2>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
            <div className="space-y-2 border-t border-[#E5DCCB] pt-4">
              <h3 className="font-serif text-base font-semibold text-[#1E1B18]">
                Three-Shuttle Korvai
              </h3>
              <p className="text-xs leading-relaxed text-[#5C544D]">
                Every bridal border is interlocked by two weavers working in tandem on traditional
                pit looms for enduring heirloom strength.
              </p>
            </div>

            <div className="space-y-2 border-t border-[#E5DCCB] pt-4">
              <h3 className="font-serif text-base font-semibold text-[#1E1B18]">
                Pure Mulberry &amp; Zari
              </h3>
              <p className="text-xs leading-relaxed text-[#5C544D]">
                Sourced from Siddlaghatta twisted mulberry silk and Surat electroplated silver zari
                threads tested for Silk Mark purity.
              </p>
            </div>

            <div className="space-y-2 border-t border-[#E5DCCB] pt-4">
              <h3 className="font-serif text-base font-semibold text-[#1E1B18]">
                Bespoke Aari Fitting
              </h3>
              <p className="text-xs leading-relaxed text-[#5C544D]">
                Hand-embroidered Maggam blouses and bridal trousseaus tailored with precision and
                delivered insured across India.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
