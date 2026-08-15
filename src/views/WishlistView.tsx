import React from 'react';
import { Product, PageView } from '../types';
import { useAllProducts } from '../hooks/useProductsQuery';
import { ProductCard } from '../components/ProductCard';
import { Heart, ShoppingBag, Trash2, ArrowLeft, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSLATIONS, LanguageCode } from '../i18n/translations';

interface WishlistViewProps {
  wishlistIds: string[];
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  onClearWishlist: () => void;
  onAddAllToCart?: (products: Product[]) => void;
  setCurrentView: (view: PageView) => void;
  isDarkMode: boolean;
  language?: LanguageCode;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  wishlistIds,
  onSelectProduct,
  onQuickAdd,
  onToggleWishlist,
  onClearWishlist,
  onAddAllToCart,
  setCurrentView,
  isDarkMode,
  language = 'es',
}) => {
  const { data: allProducts = [] } = useAllProducts();
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;

  // Filter products that are in the user's wishlist
  const wishlistedProducts = allProducts.filter((product) =>
    wishlistIds.includes(product.id)
  );

  const totalValue = wishlistedProducts.reduce((sum, item) => sum + item.price, 0);

  const handleAddAll = () => {
    if (onAddAllToCart && wishlistedProducts.length > 0) {
      onAddAllToCart(wishlistedProducts);
    } else {
      wishlistedProducts.forEach((p) => onQuickAdd(p));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('collection')}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 hover:text-[#92003a] dark:hover:text-[#c37b58] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.collection}</span>
        </button>

        <span className="text-xs font-mono-label px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
          {wishlistedProducts.length} {t.savedItems || 'Piezas Guardadas'}
        </span>
      </div>

      {/* Main Page Title Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-rose-500/10 text-rose-500 mb-1">
          <Heart className="w-7 h-7 fill-rose-500" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-slate-900 dark:text-zinc-100 tracking-tight">
          {t.wishlist || 'Lista de Deseos'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-xl mx-auto">
          {t.emptyWishlistDesc || 'Guarda tus piezas favoritas de lino, vestidos y joyería artesanal para tenerlas siempre a mano.'}
        </p>
        <div className="w-12 h-0.5 bg-[#c37b58] mx-auto mt-2" />
      </div>

      {/* Empty State */}
      {wishlistedProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-12 sm:p-16 text-center rounded-3xl border space-y-6 max-w-xl mx-auto shadow-sm ${
            isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
            <Heart className="w-10 h-10 stroke-[1.5]" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-medium text-slate-900 dark:text-zinc-100">
              {t.emptyWishlist || 'Tu lista de deseos está vacía'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Explora nuestras creaciones en lino natural, vestidos mediterráneos y joyas de autor hechas a mano en Cambrils y pulsa el corazón para guardarlas aquí.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setCurrentView('collection')}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#92003a] hover:bg-[#72002d] text-white font-black text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg"
            >
              <span>{t.exploreCollection || 'Explorar Colección'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ) : (
        /* Populated Wishlist Layout */
        <div className="space-y-8">
          
          {/* Action Bar */}
          <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                  {t.orderSummary || 'Resumen de selección'}
                </span>
                <span className="text-base font-serif font-bold text-slate-900 dark:text-zinc-100">
                  {wishlistedProducts.length} {wishlistedProducts.length === 1 ? 'artículo' : 'artículos'} &bull; Total estimado: €{totalValue.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClearWishlist}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-900/50 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors flex-1 sm:flex-none"
                title={t.clearWishlist || 'Vaciar Lista'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.clearWishlist || 'Vaciar Lista'}</span>
              </button>

              <button
                onClick={handleAddAll}
                className="px-6 py-2.5 rounded-xl bg-[#92003a] hover:bg-[#72002d] text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-md flex-1 sm:flex-none"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t.addAllToCart || 'Añadir Todo a la Cesta'}</span>
              </button>
            </div>
          </div>

          {/* Grid of Wishlist Products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {wishlistedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                  onQuickAdd={onQuickAdd}
                  isDarkMode={isDarkMode}
                  isWishlisted={true}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
