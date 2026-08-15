import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';
import { PageView, Product, CartItem, Order } from './types';
import { PRODUCTS } from './data/products';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { CartDrawer } from './components/CartDrawer';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { saveOrderToFirestore } from './services/firestoreOrders';
import { LanguageCode } from './i18n/translations';

// Initialize Stripe JS SDK at top level
const stripePromise = loadStripe(
  (import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY || 'pk_test_513LunasBoutiqueSandboxKeyExample9988776655'
);

// Views
import { HomeView } from './views/HomeView';
import { CollectionView } from './views/CollectionView';
import { ProductDetailView } from './views/ProductDetailView';
import { CartView } from './views/CartView';
import { CheckoutView } from './views/CheckoutView';
import { OrderSuccessView } from './views/OrderSuccessView';
import { AboutView } from './views/AboutView';
import { BrandingGuideView } from './views/BrandingGuideView';
import { ContactView } from './views/ContactView';
import { NotFoundView } from './views/NotFoundView';

export default function App() {
  const [currentView, setCurrentView] = useState<PageView>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Theme mode: system, light, dark
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('3lunas_theme_mode');
      if (saved === 'system' || saved === 'light' || saved === 'dark') return saved;
    } catch (e) { }
    return 'system';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const isDarkMode = themeMode === 'system' ? systemPrefersDark : themeMode === 'dark';

  // Language state (5 languages: es, cat, en, fr, de)
  const [language, setLanguage] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem('3lunas_language');
      if (saved && ['es', 'cat', 'en', 'fr', 'de'].includes(saved)) {
        return saved as LanguageCode;
      }
    } catch (e) { }
    return 'es';
  });

  // Cart state with persistence (starts strictly empty [] if no items added by user)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('3lunas_cart_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error al recuperar carrito desde localStorage:', e);
    }
    return [];
  });

  // Last order state with persistence
  const [lastOrder, setLastOrder] = useState<Order | null>(() => {
    try {
      const saved = localStorage.getItem('3lunas_last_order');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return null;
  });

  // Save states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('3lunas_cart_v1', JSON.stringify(cartItems));
    } catch (e) { }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('3lunas_theme_mode', themeMode);
    } catch (e) { }
  }, [themeMode]);

  const { i18n } = useTranslation();

  useEffect(() => {
    try {
      localStorage.setItem('3lunas_language', language);
      i18n.changeLanguage(language);
    } catch (e) { }
  }, [language, i18n]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (lastOrder) {
      try {
        localStorage.setItem('3lunas_last_order', JSON.stringify(lastOrder));
      } catch (e) { }
    }
  }, [lastOrder]);

  // Modals
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
  const [driveModalOpen, setDriveModalOpen] = useState<boolean>(false);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedProduct]);

  // Cart Handlers
  const handleAddToCart = (newItem: CartItem) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(
        i => i.product.id === newItem.product.id &&
          i.selectedSize === newItem.selectedSize &&
          i.selectedColor.name === newItem.selectedColor.name
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += newItem.quantity;
        return updated;
      }
      return [...prev, newItem];
    });
    setCartDrawerOpen(true);
  };

  const handleQuickAdd = (product: Product) => {
    handleAddToCart({
      product,
      selectedSize: product.sizes[0] || 'Única',
      selectedColor: product.colors[0] || { name: 'Estándar', hex: '#000' },
      quantity: 1
    });
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
    } else {
      setCartItems(prev => {
        const updated = [...prev];
        updated[index].quantity = newQty;
        return updated;
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product-detail');
  };

  const handleCompleteOrder = (order: Order) => {
    setLastOrder(order);
    setCartItems([]);
    saveOrderToFirestore(order).catch(e => console.warn('Order sync fallback:', e));
    setCurrentView('order-success');
  };

  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const shippingCost = cartSubtotal > 50 ? 0 : 4.95;
  const grandTotal = cartSubtotal + shippingCost;

  const stripeOptions = {
    mode: 'payment' as const,
    amount: Math.max(100, Math.round(grandTotal * 100)),
    currency: 'eur',
    appearance: {
      theme: isDarkMode ? ('night' as const) : ('stripe' as const),
      variables: {
        colorPrimary: '#92003a',
        colorBackground: isDarkMode ? '#141416' : '#ffffff',
        colorText: isDarkMode ? '#ffffff' : '#18181b',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={stripeOptions} key={`${isDarkMode}-${Math.round(grandTotal * 100)}`}>
      <div className={`min-h-screen flex flex-col relative transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'
        }`}>
        {/* Sophisticated Dark Ambient Lighting Blurs */}
        {isDarkMode && (
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-900/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[150px]"></div>
            <div className="absolute top-[40%] right-[15%] w-[30%] h-[30%] bg-amber-900/5 rounded-full blur-[140px]"></div>
          </div>
        )}

        {/* Top Announcement Banner */}
        <AnnouncementBanner
          setCurrentView={setCurrentView}
          onSelectCategory={setSelectedCategory}
          language={language}
        />

        {/* Header */}
        <Header
          currentView={currentView}
          setCurrentView={setCurrentView}
          cartCount={totalCartCount}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenCart={() => setCartDrawerOpen(true)}
          onOpenDrive={() => setDriveModalOpen(true)}
          isDarkMode={isDarkMode}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          language={language}
          setLanguage={setLanguage}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setCurrentView('collection');
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {currentView === 'home' && (
                <HomeView
                  onSelectProduct={handleSelectProduct}
                  onQuickAdd={handleQuickAdd}
                  setCurrentView={setCurrentView}
                  isDarkMode={isDarkMode}
                  language={language}
                />
              )}

              {currentView === 'collection' && (
                <CollectionView
                  onSelectProduct={handleSelectProduct}
                  onQuickAdd={handleQuickAdd}
                  isDarkMode={isDarkMode}
                  language={language}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                />
              )}

              {currentView === 'product-detail' && (
                <ProductDetailView
                  product={selectedProduct}
                  onAddToCart={handleAddToCart}
                  onSelectProduct={handleSelectProduct}
                  setCurrentView={setCurrentView}
                  isDarkMode={isDarkMode}
                  language={language}
                />
              )}

              {currentView === 'cart' && (
                <CartView
                  cartItems={cartItems}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onClearCart={handleClearCart}
                  setCurrentView={setCurrentView}
                  isDarkMode={isDarkMode}
                  language={language}
                />
              )}

              {currentView === 'checkout' && (
                <CheckoutView
                  cartItems={cartItems}
                  onCompleteOrder={handleCompleteOrder}
                  setCurrentView={setCurrentView}
                  isDarkMode={isDarkMode}
                />
              )}

              {currentView === 'order-success' && (
                <OrderSuccessView
                  order={lastOrder}
                  setCurrentView={setCurrentView}
                  isDarkMode={isDarkMode}
                />
              )}

              {currentView === 'about' && (
                <AboutView isDarkMode={isDarkMode} />
              )}

              {currentView === 'branding' && (
                <BrandingGuideView isDarkMode={isDarkMode} />
              )}

              {currentView === 'contact' && (
                <ContactView isDarkMode={isDarkMode} />
              )}

              {currentView === 'not-found' && (
                <NotFoundView
                  setCurrentView={setCurrentView}
                  isDarkMode={isDarkMode}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <Footer
          setCurrentView={setCurrentView}
          isDarkMode={isDarkMode}
        />

        {/* Overlays / Modals */}
        <SearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelectProduct={handleSelectProduct}
          setCurrentView={setCurrentView}
          isDarkMode={isDarkMode}
        />

        <CartDrawer
          isOpen={cartDrawerOpen}
          onClose={() => setCartDrawerOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          setCurrentView={setCurrentView}
          isDarkMode={isDarkMode}
          language={language}
        />

        <GoogleDriveModal
          isOpen={driveModalOpen}
          onClose={() => setDriveModalOpen(false)}
          isDarkMode={isDarkMode}
        />
      </div>
    </Elements>
  );
}
