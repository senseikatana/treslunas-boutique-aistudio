import React, { useState, useRef } from 'react';
import { PageView } from '../types';
import { TripleMoonLogo } from './TripleMoonLogo';
import { Search, ShoppingBag, Menu, X, ChevronDown, Sparkles, User, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ThemeDropdown, LanguageDropdown } from './ThemeLanguageDropdowns';
import { LanguageCode } from '../i18n/translations';

interface HeaderProps {
  currentView: PageView;
  setCurrentView: (view: PageView) => void;
  cartCount: number;
  onOpenSearch: () => void;
  onOpenCart: () => void;
  onOpenDrive?: () => void;
  isDarkMode: boolean;
  themeMode: 'system' | 'light' | 'dark';
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  cartCount,
  onOpenSearch,
  onOpenCart,
  onOpenDrive,
  isDarkMode,
  themeMode,
  setThemeMode,
  language,
  setLanguage,
  selectedCategory = 'Todos',
  onSelectCategory
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileCollectionOpen, setMobileCollectionOpen] = useState(true);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { t } = useTranslation();

  const collectionSubCategories = [
    { label: t('allCategories', 'Ver Toda la Colección'), category: 'Todos' },
    { label: t('dresses', 'Vestidos'), category: 'Vestidos' },
    { label: t('topsBlouses', 'Tops & Blusas'), category: 'Tops & Blusas' },
    { label: t('accessories', 'Accesorios'), category: 'Accesorios' },
    { label: t('jewelry', 'Joyería'), category: 'Joyería' },
  ];

  const handleNavClick = (view: PageView, category?: string) => {
    setCurrentView(view);
    if (category && onSelectCategory) {
      onSelectCategory(category);
    }
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  };

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  };

  const currentCategoryDisplay = selectedCategory || 'Todos';

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-300 border-b ${
      isDarkMode 
        ? 'bg-zinc-950/95 backdrop-blur-md border-zinc-800 text-zinc-100' 
        : 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-900 shadow-xs'
    }`}>
      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md hover:bg-zinc-800/20 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Logo */}
          <div className="flex-1 lg:flex-none flex justify-center lg:justify-start">
            <TripleMoonLogo
              variant={isDarkMode ? 'copper' : 'dark'}
              onClick={() => handleNavClick('home')}
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 text-xs font-semibold tracking-wider uppercase">
            {/* Novedades */}
            <button
              onClick={() => handleNavClick('home')}
              className={`transition-colors py-2 relative hover:text-[#c37b58] ${
                currentView === 'home' ? 'text-[#c37b58] font-bold' : ''
              }`}
            >
              {t('newArrivals', 'Novedades')}
              {currentView === 'home' && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#c37b58] to-[#92003a]"
                />
              )}
            </button>

            {/* Colección Dropdown Trigger */}
            <div
              className="relative py-2"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => handleNavClick('collection', 'Todos')}
                className={`flex items-center gap-1 transition-colors hover:text-[#c37b58] ${
                  currentView === 'collection' ? 'text-[#c37b58] font-bold' : ''
                }`}
              >
                <span>{t('collection', 'Colección')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-[#c37b58]' : ''}`} />
                {currentView === 'collection' && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#c37b58] to-[#92003a]"
                  />
                )}
              </button>

              {/* Submenu Dropdown */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className={`absolute top-full left-0 w-56 pt-2 z-50`}
                  >
                    <div
                      className={`rounded-xl shadow-xl border p-2 backdrop-blur-xl ${
                        isDarkMode
                          ? 'bg-zinc-950/95 border-zinc-800 text-zinc-100 shadow-black/60'
                          : 'bg-white/95 border-zinc-200/80 text-zinc-800 shadow-lg'
                      }`}
                    >
                      <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest text-[#c37b58] border-b border-zinc-800/20 dark:border-zinc-800 mb-1 flex items-center justify-between">
                        <span>Categorías Exclusivas</span>
                        <Sparkles className="w-3 h-3 text-[#f62477]" />
                      </div>

                      {collectionSubCategories.map((sub, idx) => {
                        const isSubActive =
                          currentView === 'collection' &&
                          (currentCategoryDisplay === sub.category ||
                            (sub.category === 'Todos' && currentCategoryDisplay === 'Todos'));

                        return (
                          <button
                            key={idx}
                            onClick={() => handleNavClick('collection', sub.category)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center justify-between group ${
                              isSubActive
                                ? isDarkMode
                                  ? 'bg-[#92003a]/20 text-[#c37b58] font-bold'
                                  : 'bg-rose-50 text-[#92003a] font-bold'
                                : 'hover:bg-zinc-500/10 hover:text-[#c37b58]'
                            }`}
                          >
                            <span>{sub.label}</span>
                            {isSubActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f62477]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sobre Erika */}
            <button
              onClick={() => handleNavClick('about')}
              className={`transition-colors py-2 relative hover:text-[#c37b58] ${
                currentView === 'about' ? 'text-[#c37b58] font-bold' : ''
              }`}
            >
              {t('aboutErika', 'Sobre Erika')}
              {currentView === 'about' && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#c37b58] to-[#92003a]"
                />
              )}
            </button>

            {/* Contacto */}
            <button
              onClick={() => handleNavClick('contact')}
              className={`transition-colors py-2 relative hover:text-[#c37b58] ${
                currentView === 'contact' ? 'text-[#c37b58] font-bold' : ''
              }`}
            >
              {t('contact', 'Contacto')}
              {currentView === 'contact' && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#c37b58] to-[#92003a]"
                />
              )}
            </button>
          </nav>

          {/* Right Icon Actions (Desktop View) */}
          <div className="hidden lg:flex items-center space-x-2.5 sm:space-x-3">
            {/* Search Button */}
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-xl hover:bg-zinc-500/10 transition-colors text-zinc-800 dark:text-zinc-200"
              title={t('search', "Buscar en la boutique")}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Google Drive & Cloud Sync Button */}
            <button
              onClick={onOpenDrive}
              className="p-2 rounded-xl hover:bg-zinc-500/10 transition-colors relative text-zinc-800 dark:text-zinc-200"
              title="Google Drive & Firebase Cloud Sync"
            >
              <HardDrive className="w-5 h-5 text-[#c37b58]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950"></span>
            </button>

            {/* Language Selector Dropdown */}
            <LanguageDropdown
              language={language}
              setLanguage={setLanguage}
              isDarkMode={isDarkMode}
            />

            {/* Theme Selector Dropdown (System, Light, Dark) */}
            <ThemeDropdown
              themeMode={themeMode}
              setThemeMode={setThemeMode}
              isDarkMode={isDarkMode}
              language={language}
            />

            {/* Shopping Bag Button */}
            <button
              onClick={onOpenCart}
              className="p-2 rounded-xl hover:bg-zinc-500/10 transition-colors relative text-zinc-800 dark:text-zinc-200"
              title={t('cart', "Ver Carrito de Compras")}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-[#92003a] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`lg:hidden border-t overflow-hidden ${
              isDarkMode ? 'bg-[#141416] border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
            }`}
          >
            <div className="px-6 py-6 space-y-4">
              
              {/* Consolidated Mobile Actions: Cart, Account, Search & Theme */}
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
                <span className="text-[10px] uppercase font-mono-label tracking-widest text-[#92003a] dark:text-[#c37b58] font-bold block">
                  Mi Carrito & Cuenta
                </span>

                <div className="space-y-2">
                  {/* Cart Action Button */}
                  <button
                    onClick={() => {
                      onOpenCart();
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isDarkMode
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100 hover:border-zinc-700'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 hover:bg-zinc-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#92003a]/10 text-[#92003a] dark:text-[#c37b58]">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold block">Carrito de Compras</span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {cartCount === 0 ? 'Sin artículos en la bolsa' : `${cartCount} producto${cartCount > 1 ? 's' : ''} añadido${cartCount > 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </div>
                    {cartCount > 0 ? (
                      <span className="bg-[#92003a] text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                        {cartCount}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono-label uppercase text-zinc-400">Ver</span>
                    )}
                  </button>

                  {/* Google Drive & Cloud Sync Button */}
                  <button
                    onClick={() => {
                      if (onOpenDrive) onOpenDrive();
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isDarkMode
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100 hover:border-zinc-700'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 hover:bg-zinc-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-[#c37b58]">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold block">Google Drive & Cloud Sync</span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Recibos, catálogos y copias de seguridad</span>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </button>

                  {/* Account Action Button */}
                  <button
                    onClick={() => handleNavClick('checkout')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isDarkMode
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100 hover:border-zinc-700'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 hover:bg-zinc-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold block">Mi Cuenta & Checkout</span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Gestiona tus pedidos y pagos</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono-label uppercase text-zinc-400">Ir</span>
                  </button>

                  {/* Quick Utility Actions Row (Search, Language & Theme) */}
                  <div className="grid grid-cols-3 gap-2 pt-1 items-center">
                    <button
                      onClick={() => {
                        onOpenSearch();
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border transition-all ${
                        isDarkMode
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100'
                      }`}
                    >
                      <Search className="w-4 h-4 text-[#c37b58]" />
                      <span className="text-xs font-bold">Buscar</span>
                    </button>

                    <div className="flex justify-center">
                      <LanguageDropdown
                        language={language}
                        setLanguage={setLanguage}
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    <div className="flex justify-center">
                      <ThemeDropdown
                        themeMode={themeMode}
                        setThemeMode={setThemeMode}
                        isDarkMode={isDarkMode}
                        language={language}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Novedades */}
              <button
                onClick={() => handleNavClick('home')}
                className={`block w-full text-left py-2 text-sm font-semibold tracking-wider uppercase border-b border-zinc-800/10 hover:text-[#c37b58] transition-colors ${
                  currentView === 'home' ? 'text-[#c37b58] font-bold' : ''
                }`}
              >
                {t('newArrivals', 'Novedades')}
              </button>

              {/* Colección Accordion */}
              <div className="border-b border-zinc-800/10 pb-2">
                <button
                  onClick={() => setMobileCollectionOpen(!mobileCollectionOpen)}
                  className={`flex items-center justify-between w-full text-left py-2 text-sm font-semibold tracking-wider uppercase hover:text-[#c37b58] transition-colors ${
                    currentView === 'collection' ? 'text-[#c37b58] font-bold' : ''
                  }`}
                >
                  <span>{t('collection', 'Colección')}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileCollectionOpen ? 'rotate-180' : ''}`} />
                </button>

                {mobileCollectionOpen && (
                  <div className="pl-4 pt-1 space-y-1.5 border-l-2 border-[#c37b58]/30 ml-1">
                    {collectionSubCategories.map((sub, idx) => {
                      const isSubActive =
                        currentView === 'collection' &&
                        (currentCategoryDisplay === sub.category ||
                          (sub.category === 'Todos' && currentCategoryDisplay === 'Todos'));

                      return (
                        <button
                          key={idx}
                          onClick={() => handleNavClick('collection', sub.category)}
                          className={`block w-full text-left py-1.5 text-xs font-medium tracking-wide transition-colors ${
                            isSubActive
                              ? 'text-[#c37b58] font-bold'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sobre Erika */}
              <button
                onClick={() => handleNavClick('about')}
                className={`block w-full text-left py-2 text-sm font-semibold tracking-wider uppercase border-b border-zinc-800/10 hover:text-[#c37b58] transition-colors ${
                  currentView === 'about' ? 'text-[#c37b58] font-bold' : ''
                }`}
              >
                {t('aboutErika', 'Sobre Erika')}
              </button>

              {/* Contacto */}
              <button
                onClick={() => handleNavClick('contact')}
                className={`block w-full text-left py-2 text-sm font-semibold tracking-wider uppercase border-b border-zinc-800/10 hover:text-[#c37b58] transition-colors ${
                  currentView === 'contact' ? 'text-[#c37b58] font-bold' : ''
                }`}
              >
                {t('contact', 'Contacto')}
              </button>

              <div className="pt-4 flex items-center justify-between text-xs text-zinc-400">
                <span>📍 Cambrils, Tarragona</span>
                <span className="text-[#c37b58]">@3lunasboutique</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

