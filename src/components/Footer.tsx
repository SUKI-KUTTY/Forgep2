import type { AppRoute } from './Navbar';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
  isAdmin: boolean;
}

export function Footer({ onNavigate, isAdmin }: FooterProps) {
  return (
    <footer className="border-t border-[#E5DCCB] bg-[#FAF7F2]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <p className="font-serif text-lg font-semibold text-[#6B1D2F]">Kaveri Silks</p>
          <p className="text-xs text-[#5C544D]">
            No. 28, North Mada Street, Mylapore, Chennai · Kanchipuram Weaving Guild
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#5C544D]">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="hover:text-[#6B1D2F] transition-colors cursor-pointer"
          >
            Storefront
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/orders')}
            className="hover:text-[#6B1D2F] transition-colors cursor-pointer"
          >
            My Orders
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="hover:text-[#6B1D2F] transition-colors cursor-pointer"
            >
              Atelier Admin
            </button>
          )}
          <span className="text-[#5C544D]/70">© 2026 Kaveri Silks</span>
        </div>
      </div>
    </footer>
  );
}
