import { useCallback, useEffect, useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CraftsmanshipSection } from './components/CraftsmanshipSection';
import { Footer } from './components/Footer';
import { HeroBanner } from './components/HeroBanner';
import { Navbar, type AppRoute } from './components/Navbar';
import { ProductGrid, type CategoryFilter } from './components/ProductGrid';
import { WatchlistDrawer } from './components/WatchlistDrawer';
import { WhatsAppButton } from './components/WhatsAppButton';
import {
  addToWatchlistApi,
  fetchProducts,
  fetchWatchlist,
  getSession,
  removeFromWatchlistApi,
  signOutCustomer,
} from './lib/api';
import { ADMIN_EMAIL } from './lib/supabase';
import { AdminPage } from './pages/AdminPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import type { AuthUser, CartItem, Product, Profile } from './types/boutique';

const CART_STORAGE_KEY = 'kaveri_silks_cart_v1';
const WATCHLIST_STORAGE_KEY = 'kaveri_silks_watchlist_v1';

interface ParsedLocation {
  route: AppRoute;
  productId: string | null;
}

function parseLocation(): ParsedLocation {
  const path = window.location.pathname;
  if (path === '/orders') return { route: '/orders', productId: null };
  if (path === '/admin') return { route: '/admin', productId: null };
  if (path.startsWith('/product/')) {
    const id = decodeURIComponent(path.slice('/product/'.length));
    if (id) return { route: '/product', productId: id };
  }
  return { route: '/', productId: null };
}

export default function App() {
  const [locationState, setLocationState] = useState<ParsedLocation>(() => parseLocation());

  // Auth & Profile state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Catalog state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart, Watchlist & Checkout state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [watchlistIds, setWatchlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState<string | undefined>(undefined);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [buyNowItems, setBuyNowItems] = useState<CartItem[] | null>(null);
  const [pendingCheckoutAfterAuth, setPendingCheckoutAfterAuth] = useState(false);

  const isAdmin = Boolean(user && user.email.toLowerCase() === ADMIN_EMAIL);

  const loadCatalog = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : 'Unable to load catalog');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
    getSession()
      .then(async (session) => {
        if (session) {
          setUser(session.user);
          setProfile(session.profile);
          try {
            const serverIds = await fetchWatchlist(session.user.id);
            setWatchlistIds((localIds) => Array.from(new Set([...serverIds, ...localIds])));
          } catch {
            // keep local watchlist if sync fails
          }
        }
      })
      .finally(() => setAuthReady(true));
  }, [loadCatalog]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlistIds));
    } catch {
      // ignore storage quota errors
    }
  }, [watchlistIds]);

  useEffect(() => {
    const onPopState = () => setLocationState(parseLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((target: AppRoute, categoryJump?: string) => {
    if (window.location.pathname !== target) {
      window.history.pushState({}, '', target);
    }
    setLocationState({ route: target, productId: null });
    if (categoryJump) {
      setActiveCategory(categoryJump as CategoryFilter);
      setTimeout(() => {
        document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const openProductDetail = useCallback((productId: string) => {
    const targetPath = `/product/${encodeURIComponent(productId)}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setLocationState({ route: '/product', productId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleToggleWatchlist = async (productId: string) => {
    const isSaved = watchlistIds.includes(productId);
    setWatchlistIds((prev) =>
      isSaved ? prev.filter((id) => id !== productId) : [productId, ...prev]
    );
    if (user) {
      try {
        if (isSaved) await removeFromWatchlistApi(user.id, productId);
        else await addToWatchlistApi(user.id, productId);
      } catch {
        // local state already updated
      }
    }
  };

  const handleAddToBag = (product: Product, size: string) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.size === size
      );
      if (existingIdx >= 0) {
        return prev.map((item, idx) =>
          idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, size, quantity: 1 }];
    });
  };

  const handleMoveWatchlistToBag = (product: Product) => {
    const defaultSize = product.sizes.length > 0 ? product.sizes[0] : 'Free Size';
    handleAddToBag(product, defaultSize);
    handleToggleWatchlist(product.id);
    setWatchlistOpen(false);
    setCartOpen(true);
  };

  const handleUpdateQty = (productId: string, size: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId && item.size === size
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (productId: string, size: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.size === size))
    );
  };

  const handleProceedToCheckout = () => {
    setBuyNowItems(null);
    setCartOpen(false);
    if (!user) {
      setAuthPrompt('Sign in or create an account to record your delivery address and place your order.');
      setPendingCheckoutAfterAuth(true);
      setAuthModalOpen(true);
      return;
    }
    setCheckoutOpen(true);
  };

  const handleBuyNow = (product: Product, size: string) => {
    const directItem: CartItem[] = [{ product, size, quantity: 1 }];
    setBuyNowItems(directItem);
    if (!user) {
      setAuthPrompt('Sign in or create an account to complete your purchase.');
      setPendingCheckoutAfterAuth(true);
      setAuthModalOpen(true);
      return;
    }
    setCheckoutOpen(true);
  };

  const handleAuthenticated = async (authUser: AuthUser, userProfile: Profile | null) => {
    setUser(authUser);
    setProfile(userProfile);
    try {
      const serverIds = await fetchWatchlist(authUser.id);
      const merged = Array.from(new Set([...serverIds, ...watchlistIds]));
      setWatchlistIds(merged);
      await Promise.all(
        watchlistIds
          .filter((id) => !serverIds.includes(id))
          .map((id) => addToWatchlistApi(authUser.id, id))
      );
    } catch {
      // ignore watchlist sync failures
    }
    if (pendingCheckoutAfterAuth) {
      setPendingCheckoutAfterAuth(false);
      setCheckoutOpen(true);
    }
  };

  const handleSignOut = async () => {
    await signOutCustomer();
    setUser(null);
    setProfile(null);
    if (locationState.route === '/admin') {
      navigate('/');
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const watchlistedProducts = products.filter((p) => watchlistIds.includes(p.id));
  const checkoutItems = buyNowItems ?? cart;
  const activeProduct = locationState.productId
    ? products.find((p) => p.id === locationState.productId)
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E1B18]">
      <Navbar
        currentRoute={locationState.route}
        onNavigate={navigate}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        watchlistCount={watchlistedProducts.length}
        onOpenWatchlist={() => setWatchlistOpen(true)}
        user={user}
        profile={profile}
        isAdmin={isAdmin}
        onOpenAuth={() => {
          setPendingCheckoutAfterAuth(false);
          setAuthPrompt(undefined);
          setAuthModalOpen(true);
        }}
        onSignOut={handleSignOut}
      />

      <div className="flex-1">
        {locationState.route === '/' && (
          <main>
            <HeroBanner
              onShopCollections={() =>
                document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })
              }
            />
            <ProductGrid
              products={products}
              loading={productsLoading}
              error={productsError}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              watchlistIds={watchlistIds}
              onToggleWatchlist={handleToggleWatchlist}
              onViewProduct={openProductDetail}
              onAddToBag={handleAddToBag}
              onBuyNow={handleBuyNow}
            />
            <CraftsmanshipSection />
          </main>
        )}

        {locationState.route === '/product' && (
          <ProductDetailPage
            product={activeProduct}
            loadingProducts={productsLoading}
            user={user}
            profile={profile}
            isWatchlisted={Boolean(activeProduct && watchlistIds.includes(activeProduct.id))}
            onToggleWatchlist={handleToggleWatchlist}
            onAddToBag={handleAddToBag}
            onBuyNow={handleBuyNow}
            onOpenAuth={() => {
              setPendingCheckoutAfterAuth(false);
              setAuthPrompt('Sign in to review products you have ordered.');
              setAuthModalOpen(true);
            }}
            onBackToStore={() => navigate('/')}
          />
        )}

        {locationState.route === '/orders' && (
          <OrdersPage
            user={user}
            onOpenAuth={() => {
              setPendingCheckoutAfterAuth(false);
              setAuthPrompt('Sign in to access your order history.');
              setAuthModalOpen(true);
            }}
            onBackToStore={() => navigate('/')}
          />
        )}

        {locationState.route === '/admin' && authReady && (
          <AdminPage
            isAdmin={isAdmin}
            products={products}
            onProductsChanged={loadCatalog}
            onUnauthorized={() => navigate('/')}
          />
        )}
      </div>

      <Footer onNavigate={navigate} isAdmin={isAdmin} />
      <WhatsAppButton />

      <WatchlistDrawer
        open={watchlistOpen}
        items={watchlistedProducts}
        onClose={() => setWatchlistOpen(false)}
        onRemoveItem={handleToggleWatchlist}
        onMoveToBag={handleMoveWatchlistToBag}
        onViewProduct={openProductDetail}
      />

      <CartDrawer
        open={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={handleProceedToCheckout}
      />

      <AuthModal
        open={authModalOpen}
        initialPrompt={authPrompt}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingCheckoutAfterAuth(false);
        }}
        onAuthenticated={handleAuthenticated}
      />

      <CheckoutModal
        open={checkoutOpen}
        items={checkoutItems}
        user={user}
        profile={profile}
        onClose={() => {
          setCheckoutOpen(false);
          setBuyNowItems(null);
        }}
        onOrderSuccess={(_order, updatedProfile) => {
          if (!buyNowItems) {
            setCart([]);
          }
          setBuyNowItems(null);
          setProfile((prev) => (prev ? { ...prev, ...updatedProfile } : prev));
        }}
        onViewMyOrders={() => navigate('/orders')}
      />
    </div>
  );
}
