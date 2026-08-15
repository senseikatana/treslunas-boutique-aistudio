import React, { useState } from 'react';
import { CartItem, ShippingDetails, PaymentMethod, Order, PageView } from '../types';
import { StripeEmbeddedPayment } from '../components/StripeEmbeddedPayment';
import { registerServerOrder, triggerMockWebhookEvent } from '../services/stripeApi';
import { ShieldCheck, Lock, Truck, ShoppingBag } from 'lucide-react';

interface CheckoutViewProps {
  cartItems: CartItem[];
  onCompleteOrder: (order: Order) => void;
  setCurrentView: (view: PageView) => void;
  isDarkMode: boolean;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cartItems,
  onCompleteOrder,
  setCurrentView,
  isDarkMode
}) => {
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shippingCost = subtotal > 50 ? 0 : 4.95;
  const total = subtotal + shippingCost;

  const [formData, setFormData] = useState<ShippingDetails>({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    email: '',
    phone: '',
    deliveryOption: 'local'
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleStripeSuccess = async (paymentId: string, methodDetails: string) => {
    if (!formData.fullName || !formData.address || !formData.email) {
      setFormError('Por favor, rellenar los datos de envío antes de confirmar el pago.');
      return;
    }

    const orderId = `3L-STRIPE-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder: Order = {
      id: orderId,
      items: cartItems,
      shipping: formData,
      paymentMethod: 'card',
      subtotal,
      shippingCost,
      total,
      createdAt: new Date().toLocaleDateString('es-ES'),
      status: 'Confirmado'
    };

    // Register order in backend server store
    await registerServerOrder({
      ...newOrder,
      paymentIntentId: paymentId
    });

    // Trigger payment_intent.succeeded webhook confirmation
    await triggerMockWebhookEvent({
      paymentIntentId: paymentId,
      orderId: orderId,
      eventType: 'payment_intent.succeeded'
    });

    onCompleteOrder(newOrder);
  };


  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Title */}
      <div className="text-center space-y-2">
        <span className="font-mono-label text-[#92003a] dark:text-[#c37b58] font-bold">
          Checkout Seguro
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-zinc-900 dark:text-white">
          3 Lunas Payment & Checkout
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Finaliza tu pedido sin salir de la web con pasarela integrada Stripe
        </p>
      </div>

      {formError && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs text-center font-bold">
          ⚠️ {formError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column: Shipping & Billing Details */}
        <div className={`lg:col-span-6 p-6 sm:p-8 rounded-2xl border space-y-6 ${isDarkMode ? 'bg-[#141416] border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h2 className="font-serif font-bold text-xl text-[#92003a] dark:text-[#c37b58]">
              Datos de Envío y Facturación
            </h2>
            <Truck className="w-5 h-5 text-[#c37b58]" />
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-500 dark:text-zinc-400 font-bold mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => {
                  setFormData({ ...formData, fullName: e.target.value });
                  setFormError(null);
                }}
                placeholder="Nombre y Apellidos"
                className={`w-full px-4 py-3 rounded-lg border outline-none transition-all ${isDarkMode
                    ? 'bg-zinc-900 border-zinc-700 text-white focus:border-[#92003a]'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-[#92003a]'
                  }`}
              />
            </div>

            <div>
              <label className="block text-zinc-500 dark:text-zinc-400 font-bold mb-1">Dirección de Entrega *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  setFormError(null);
                }}
                placeholder="Calle, número, piso"
                className={`w-full px-4 py-3 rounded-lg border outline-none transition-all ${isDarkMode
                    ? 'bg-zinc-900 border-zinc-700 text-white focus:border-[#92003a]'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-[#92003a]'
                  }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-500 dark:text-zinc-400 font-bold mb-1">Población / Ciudad *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Cambrils, Reus, Tarragona..."
                  className={`w-full px-4 py-3 rounded-lg border outline-none transition-all ${isDarkMode
                      ? 'bg-zinc-900 border-zinc-700 text-white focus:border-[#92003a]'
                      : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-[#92003a]'
                    }`}
                />
              </div>

              <div>
                <label className="block text-zinc-500 dark:text-zinc-400 font-bold mb-1">Código Postal</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="43850"
                  className={`w-full px-4 py-3 rounded-lg border outline-none transition-all ${isDarkMode
                      ? 'bg-zinc-900 border-zinc-700 text-white focus:border-[#92003a]'
                      : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-[#92003a]'
                    }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-500 dark:text-zinc-400 font-bold mb-1">Email Confirmación *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setFormError(null);
                  }}
                  placeholder="email@ejemplo.com"
                  className={`w-full px-4 py-3 rounded-lg border outline-none transition-all ${isDarkMode
                      ? 'bg-zinc-900 border-zinc-700 text-white focus:border-[#92003a]'
                      : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-[#92003a]'
                    }`}
                />
              </div>

              <div>
                <label className="block text-zinc-500 dark:text-zinc-400 font-bold mb-1">Teléfono Móvil</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+34 600 000 000"
                  className={`w-full px-4 py-3 rounded-lg border outline-none transition-all ${isDarkMode
                      ? 'bg-zinc-900 border-zinc-700 text-white focus:border-[#92003a]'
                      : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-[#92003a]'
                    }`}
                />
              </div>
            </div>
          </div>

          {/* Resumen Carrito */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
            <span className="font-mono-label text-zinc-500 font-bold block mb-2">Resumen de la Cesta ({cartItems.length} artículos)</span>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <img src={item.product.image} alt={item.product.name} className="w-9 h-9 object-cover rounded" />
                    <span className="truncate text-zinc-700 dark:text-zinc-300">{item.product.name} (x{item.quantity})</span>
                  </div>
                  <span className="font-mono font-bold shrink-0">€{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-1">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal:</span>
                <span className="font-mono">€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Envío (Express Cambrils / Tarragona):</span>
                <span className="font-mono">{shippingCost === 0 ? 'GRATIS' : `€${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-zinc-900 dark:text-white pt-1">
                <span>Total Pedido:</span>
                <span className="font-mono text-[#92003a] dark:text-[#c37b58]">€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Embedded Stripe Gateway */}
        <div className={`lg:col-span-6 p-6 sm:p-8 rounded-2xl border space-y-5 ${isDarkMode ? 'bg-[#141416] border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h2 className="font-serif font-bold text-xl text-[#92003a] dark:text-[#c37b58]">
              Pasarela de Pago Integrada
            </h2>
            <div className="flex items-center gap-1 bg-[#92003a]/10 px-2.5 py-1 rounded-full border border-[#92003a]/20">
              <ShieldCheck className="w-3.5 h-3.5 text-[#92003a] dark:text-[#c37b58]" />
              <span className="font-mono-label text-[10px] text-[#92003a] dark:text-[#c37b58] font-bold">Stripe Payments</span>
            </div>
          </div>

          <StripeEmbeddedPayment
            total={total}
            isDarkMode={isDarkMode}
            onPaymentSuccess={handleStripeSuccess}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        </div>

      </div>
    </div>
  );
};

