import { Heart, ShoppingBag, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { AuthUser, Profile } from '../types/boutique';

export type AppRoute = '/' | '/orders' | '/admin' | '/product';

interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute, categoryJump?: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  watchlistCount: number;
  onOpenWatchlist: () => void;
  user: AuthUser | null;
  profile: Profile | null;
  isAdmin: boolean;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export function Navbar({
  currentRoute,
  onNavigate,
  cartCount,
  onOpenCart,
  watchlistCount,
  onOpenWatchlist,
  user,
  profile,
  isAdmin,
  onOpenAuth,
  onSignOut,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (route: AppRoute, categoryJump?: string) => {
    setMobileMenuOpen(false);
    onNavigate(route, categoryJump);
  };

  const displayName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E5DCCB]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('/')}
          className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#6B1D2F] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#C59B27] rounded-sm cursor-pointer"
        >
          Kaveri Silks
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5C544D]"
        >
          <button
            type="button"
            onClick={() => handleNav('/', 'ALL')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#6B1D2F] cursor-pointer ${
              currentRoute === '/' ? 'text-[#6B1D2F] border-b border-[#C59B27]' : ''
            }`}
          >
            Collections
          </button>
          <button
            type="button"
            onClick={() => handleNav('/', 'Bridal Silks')}
            className="whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#6B1D2F] cursor-pointer"
          >
            Bridal Silks
          </button>
          <button
            type="button"
            onClick={() => handleNav('/orders')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#6B1D2F] cursor-pointer ${
              currentRoute === '/orders' ? 'text-[#6B1D2F] border-b border-[#C59B27]' : ''
            }`}
          >
            My Orders
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleNav('/admin')}
              className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#6B1D2F] cursor-pointer ${
                currentRoute === '/admin' ? 'text-[#6B1D2F] border-b border-[#C59B27]' : ''
              }`}
            >
              Admin
            </button>
          )}
        </nav>

        {/* Zone 3: Compact Primary Action Cluster */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNav('/orders')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1E1B18] hover:text-[#6B1D2F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title={user.email}
              >
                <User className="w-4 h-4 text-[#6B1D2F]" aria-hidden="true" />
                <span className="max-w-[110px] truncate">{displayName}</span>
              </button>
              <button
                type="button"
                onClick={onSignOut}
                aria-label="Sign out"
                title="Sign out"
                className="p-2 text-[#5C544D] hover:text-[#6B1D2F] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1E1B18] hover:text-[#6B1D2F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <User className="w-4 h-4 text-[#6B1D2F]" aria-hidden="true" />
              <span>Sign In</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenWatchlist}
            aria-label={`Open watchlist with ${watchlistCount} saved items`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1E1B18] border border-[#E5DCCB] hover:border-[#6B1D2F] transition-colors rounded-md whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 ${watchlistCount > 0 ? 'fill-[#6B1D2F] text-[#6B1D2F]' : 'text-[#6B1D2F]'}`}
              aria-hidden="true"
            />
            <span className="tabular-nums">{watchlistCount}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Open shopping bag with ${cartCount} items`}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#FAF7F2] bg-[#6B1D2F] hover:bg-[#521422] transition-colors rounded-md whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C59B27]"
          >
            <ShoppingBag className="w-4 h-4 text-[#DFC06B]" aria-hidden="true" />
            <span>Bag</span>
            <span className="tabular-nums font-semibold">({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden p-2 text-[#1E1B18] hover:text-[#6B1D2F] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5DCCB] bg-[#FAF7F2] px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={() => handleNav('/', 'ALL')}
            className="block w-full text-left py-2.5 text-sm font-medium text-[#1E1B18] hover:text-[#6B1D2F]"
          >
            Collections
          </button>
          <button
            type="button"
            onClick={() => handleNav('/', 'Bridal Silks')}
            className="block w-full text-left py-2.5 text-sm font-medium text-[#1E1B18] hover:text-[#6B1D2F]"
          >
            Bridal Silks
          </button>
          <button
            type="button"
            onClick={() => handleNav('/orders')}
            className="block w-full text-left py-2.5 text-sm font-medium text-[#1E1B18] hover:text-[#6B1D2F]"
          >
            My Orders
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleNav('/admin')}
              className="block w-full text-left py-2.5 text-sm font-medium text-[#6B1D2F]"
            >
              Admin Dashboard
            </button>
          )}
          <div className="pt-2 border-t border-[#E5DCCB]">
            {user ? (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#5C544D] truncate">{user.email}</span>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignOut();
                  }}
                  className="text-sm font-medium text-[#6B1D2F]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full py-2.5 text-sm font-semibold text-[#6B1D2F] text-left"
              >
                Sign In / Create Account
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
