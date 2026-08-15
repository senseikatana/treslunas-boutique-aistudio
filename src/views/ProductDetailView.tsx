import React, { useState } from 'react';
import { Product, CartItem, PageView } from '../types';
import { PRODUCTS } from '../data/products';
import { ShoppingBag, MessageCircle, ChevronDown, Check, Ruler, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { LanguageCode } from '../i18n/translations';

interface ProductDetailViewProps {
  product: Product;
  onAddToCart: (item: CartItem) => void;
  onSelectProduct: (product: Product) => void;
  setCurrentView: (view: PageView) => void;
  isDarkMode: boolean;
  language?: LanguageCode;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onAddToCart,
  onSelectProduct,
  setCurrentView,
  isDarkMode,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || { name: 'Único', hex: '#000000' });
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  const { t } = useTranslation();

  // Complete the look products
  const completeTheLookProducts = (product.completeTheLookIds || [])
    .map(id => PRODUCTS.find(p => p.id === id))
    .filter((p): p is Product => p !== undefined);

  const handleAdd = () => {
    onAddToCart({
      product,
      selectedSize,
      selectedColor,
      quantity
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {addedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 font-medium text-xs uppercase tracking-wider"
          >
            <Check className="w-5 h-5 bg-white/20 p-0.5 rounded-full" />
            <span>¡Añadido a la cesta con éxito!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left: Gallery (Thumbnails + Main Image) */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          
          {/* Thumbnails vertical column */}
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-16 h-20 md:w-20 md:h-24 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                  selectedImage === idx
                    ? 'border-[#92003a] scale-105 shadow-md'
                    : 'border-slate-200 dark:border-zinc-800 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Main Selected Image */}
          <div className="flex-1 aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-900 relative border border-slate-200 dark:border-zinc-800 group">
            <motion.img
              key={selectedImage}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {/* Wishlist Button in Image */}
            <button
              onClick={() => onToggleWishlist && onToggleWishlist(product)}
              className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all duration-200 shadow-md ${
                isWishlisted
                  ? 'bg-rose-500 text-white scale-105'
                  : 'bg-black/40 text-white/80 hover:text-rose-400 hover:bg-black/60'
              }`}
              title={isWishlisted ? t('removeFromWishlist', 'Quitar de Favoritos') : t('addToWishlist', 'Guardar en Favoritos')}
              aria-label={isWishlisted ? t('removeFromWishlist', 'Quitar de Favoritos') : t('addToWishlist', 'Guardar en Favoritos')}
            >
              <Heart className={`w-5 h-5 transition-transform ${isWishlisted ? 'fill-current scale-110' : ''}`} />
            </button>
          </div>

        </div>

        {/* Right: Product Details Form */}
        <div className="lg:col-span-5 space-y-6">
          
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#c37b58]">
              {t('collection', 'Colección')} / {product.category}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-1 text-slate-900 dark:text-zinc-100">
              {product.name}
            </h1>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-heading font-black text-2xl text-[#92003a] dark:text-[#c37b58]">
                €{product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-slate-400 dark:text-zinc-500 line-through">
                  €{product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <p className="text-xs md:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
            {product.description}
          </p>

          {/* Erika's Advice Callout Box */}
          {product.erikaAdvice && (
            <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
              isDarkMode ? 'bg-[#92003a]/10 border-[#92003a]/30 text-zinc-300' : 'bg-rose-50/80 border-[#92003a]/20 text-slate-800'
            }`}>
              <div className="font-bold text-[#92003a] dark:text-[#c37b58] uppercase tracking-wider flex items-center gap-1.5">
                <span>✨ El consejo de Erika:</span>
              </div>
              <p className="italic">{product.erikaAdvice}</p>
            </div>
          )}

          {/* Color Selector */}
          {product.colors.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                {t('selectColor', 'Seleccionar Color')}: <span className="font-semibold text-slate-800 dark:text-zinc-200">{selectedColor.name}</span>
              </label>
              <div className="flex gap-3">
                {product.colors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(c)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform ${
                      selectedColor.name === c.name ? 'border-[#92003a] scale-110 ring-2 ring-[#92003a]/30' : 'border-slate-300 dark:border-zinc-700'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {selectedColor.name === c.name && (
                      <Check className={`w-4 h-4 ${c.hex === '#FFFFFF' ? 'text-black' : 'text-white'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {product.sizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">{t('selectSize', 'Seleccionar Talla')}</label>
                <button
                  onClick={() => setSizeGuideOpen(true)}
                  className="text-slate-500 dark:text-zinc-400 hover:text-[#c37b58] underline flex items-center gap-1"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>{t('sizeGuide', 'Guía de tallas')}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`w-12 h-10 rounded-xl border text-xs font-bold transition-colors ${
                      selectedSize === sz
                        ? 'bg-[#92003a] text-white border-[#92003a]'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <div>
                <label htmlFor="Quantity-detail" className="sr-only">Cantidad</label>
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-12">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="size-10 leading-10 text-center text-slate-600 transition hover:opacity-75 dark:text-zinc-300 font-bold"
                  >
                    &minus;
                  </button>

                  <input
                    type="number"
                    id="Quantity-detail"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1) {
                        setQuantity(val);
                      }
                    }}
                    className="h-10 w-12 border-transparent text-center text-sm font-bold text-slate-900 dark:text-white bg-transparent [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="size-10 leading-10 text-center text-slate-600 transition hover:opacity-75 dark:text-zinc-300 font-bold"
                  >
                    &plus;
                  </button>
                </div>
              </div>

              <button
                onClick={handleAdd}
                className="flex-1 h-12 rounded-xl bg-[#92003a] hover:bg-[#72002d] text-white font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t('addToCart', 'Añadir a la Cesta')}</span>
              </button>

              <button
                onClick={() => onToggleWishlist && onToggleWishlist(product)}
                className={`h-12 w-12 rounded-xl border flex items-center justify-center transition-all shadow-sm ${
                  isWishlisted
                    ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-rose-300 hover:text-rose-500'
                }`}
                title={isWishlisted ? t('removeFromWishlist', 'Quitar de Favoritos') : t('addToWishlist', 'Guardar en Favoritos')}
                aria-label={isWishlisted ? t('removeFromWishlist', 'Quitar de Favoritos') : t('addToWishlist', 'Guardar en Favoritos')}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            {/* WhatsApp Direct Consult Button */}
            <a
              href={`https://wa.me/34600123456?text=Hola%20Erika,%20tengo%20una%20consulta%20sobre%20la%20pieza%20${encodeURIComponent(product.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-3 rounded-xl border font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                isDarkMode 
                  ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800' 
                  : 'border-slate-200 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <span>{t('chatWithErika', 'Hablar con Erika en WhatsApp')}</span>
            </a>
          </div>

          {/* Completa el Look Section */}
          {completeTheLookProducts.length > 0 && (
            <div className="pt-6 border-t border-slate-200 dark:border-zinc-800 space-y-3">
              <h4 className="font-serif font-bold text-base text-slate-900 dark:text-zinc-100">Completa el look</h4>
              <div className="grid grid-cols-2 gap-3">
                {completeTheLookProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectProduct(p)}
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-3 transition-colors ${
                      isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-[#c37b58]' : 'bg-white border-slate-200 hover:border-[#92003a] shadow-xs'
                    }`}
                  >
                    <img src={p.images[0]} alt={p.name} className="w-12 h-14 object-cover rounded-lg" />
                    <div>
                      <h5 className="font-serif font-bold text-xs line-clamp-1 text-slate-900 dark:text-zinc-100">{p.name}</h5>
                      <span className="text-xs font-black text-[#92003a] dark:text-[#c37b58]">€{p.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accordion: Details, Care, Shipping */}
          <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-2">
            <details className="group [&_summary::-webkit-details-marker]:hidden border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 transition-colors">
              <summary className="flex cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800/60">
                <span>{t('composition', 'Composición y Cuidados')}</span>
                <svg
                  aria-hidden="true"
                  className="size-4 shrink-0 transition-transform duration-300 group-open:-rotate-180 text-slate-500 dark:text-zinc-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-4 pt-2 text-xs text-slate-600 dark:text-zinc-400 space-y-2 border-t border-slate-100 dark:border-zinc-800/40">
                <p>{product.careGuide}</p>
                <ul className="list-disc list-inside space-y-1 pt-1">
                  {product.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </details>

            <details className="group [&_summary::-webkit-details-marker]:hidden border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 transition-colors">
              <summary className="flex cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800/60">
                <span>Envíos & Recogida en Cambrils</span>
                <svg
                  aria-hidden="true"
                  className="size-4 shrink-0 transition-transform duration-300 group-open:-rotate-180 text-slate-500 dark:text-zinc-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-4 pt-2 text-xs text-slate-600 dark:text-zinc-400 space-y-2 border-t border-slate-100 dark:border-zinc-800/40">
                <p>• <strong>Click & Collect:</strong> Recogida gratuita en tienda en Cambrils (Carrer de la Mar, 14).</p>
                <p>• <strong>Envío Exprés 24h:</strong> Gratis en pedidos superiores a €50 para Cambrils, Reus, Salou y Tarragona.</p>
              </div>
            </details>
          </div>

        </div>

      </div>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {sizeGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-md w-full p-6 rounded-2xl border shadow-2xl space-y-4 ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-black text-sm uppercase tracking-wider">Guía de Tallas — 3 Lunas</h3>
                <button onClick={() => setSizeGuideOpen(false)}>
                  <ChevronDown className="w-5 h-5 rotate-180" />
                </button>
              </div>

              <div className="text-xs space-y-2">
                <table className="w-full border-collapse text-center">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-700 text-[#c37b58]">
                      <th className="py-2">Talla</th>
                      <th className="py-2">Pecho (cm)</th>
                      <th className="py-2">Cintura (cm)</th>
                      <th className="py-2">Cadera (cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300">
                    <tr><td className="py-1.5 font-bold">XS</td><td>82-85</td><td>62-65</td><td>90-93</td></tr>
                    <tr><td className="py-1.5 font-bold">S</td><td>86-89</td><td>66-69</td><td>94-97</td></tr>
                    <tr><td className="py-1.5 font-bold">M</td><td>90-93</td><td>70-73</td><td>98-101</td></tr>
                    <tr><td className="py-1.5 font-bold">L</td><td>94-97</td><td>74-77</td><td>102-105</td></tr>
                    <tr><td className="py-1.5 font-bold">XL</td><td>98-102</td><td>78-82</td><td>106-110</td></tr>
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => setSizeGuideOpen(false)}
                className="w-full py-2.5 bg-[#92003a] text-white text-xs font-bold rounded-xl"
              >
                Cerrar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

