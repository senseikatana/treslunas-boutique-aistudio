import React from 'react';
import { Product } from '../types';
import { ShoppingBag, Eye, Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  isDarkMode: boolean;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onQuickAdd,
  isDarkMode,
  isWishlisted = false,
  onToggleWishlist
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className={`group relative rounded-xl overflow-hidden border transition-all duration-300 flex flex-col ${
        isDarkMode 
          ? 'bg-zinc-900 border-zinc-800 hover:border-[#c37b58]/50 shadow-lg shadow-black/40' 
          : 'bg-white border-slate-200 hover:border-[#92003a]/40 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Product Image Box */}
      <div 
        onClick={() => onSelect(product)}
        className="relative aspect-[3/4] w-full overflow-hidden cursor-pointer bg-zinc-900/10"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {product.isNew && (
            <span className="bg-[#92003a] text-white font-mono-label font-bold px-2 py-0.5 rounded-xs shadow-sm">
              NUEVO
            </span>
          )}
          {product.isBestseller && (
            <span className="bg-[#c37b58] text-white font-mono-label font-bold px-2 py-0.5 rounded-xs shadow-sm">
              FAVORITO ERIKA
            </span>
          )}
        </div>

        {/* Favorite Wishlist Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleWishlist) {
              onToggleWishlist(product);
            }
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-10 ${
            isWishlisted
              ? 'bg-rose-500 text-white shadow-md scale-105'
              : 'bg-black/40 text-white/80 hover:text-rose-400 hover:bg-black/60 hover:scale-105'
          }`}
          title={isWishlisted ? 'Quitar de lista de deseos' : 'Guardar en lista de deseos'}
          aria-label={isWishlisted ? 'Quitar de lista de deseos' : 'Guardar en lista de deseos'}
        >
          <Heart className={`w-4 h-4 transition-transform ${isWishlisted ? 'fill-current scale-110' : ''}`} />
        </button>

        {/* Quick Action Overlay on Desktop */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="px-4 py-2.5 rounded bg-white text-zinc-900 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:bg-zinc-100 transition-colors transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver Pieza</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(product);
            }}
            className="px-4 py-2.5 rounded bg-[#92003a] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:bg-[#b21b50] transition-colors transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>+ Cesta</span>
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div 
          onClick={() => onSelect(product)} 
          className="cursor-pointer space-y-1"
        >
          <div className="text-[10px] uppercase font-bold tracking-widest text-[#c37b58]">
            {product.category}
          </div>
          <h3 className={`font-serif text-base md:text-lg font-semibold line-clamp-1 transition-colors ${
            isDarkMode ? 'text-zinc-100 group-hover:text-[#c37b58]' : 'text-zinc-900 group-hover:text-[#92003a]'
          }`}>
            {product.name}
          </h3>
        </div>

        <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-800/20">
          <div className="flex items-baseline gap-2">
            <span className="font-mono-label text-sm md:text-base font-bold text-[#92003a] dark:text-[#EAB393]">
              €{product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="font-mono-label text-xs text-zinc-500 line-through">
                €{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={() => onQuickAdd(product)}
            className="sm:hidden p-2 rounded bg-[#92003a] text-white hover:bg-[#b21b50] transition-colors"
            title="Añadir a la cesta"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
