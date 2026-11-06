import React, { useState } from 'react';
import { CartItem, UserProfile, isAuthorizedStoreStaffOrAdmin } from "../../types/types";
import CheckoutModal from './CheckoutModal';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Truck, Store, MapPin, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  currentUser?: UserProfile | null;
  onRequireAuth?: (featureName?: string) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentUser,
  onRequireAuth
}: CartDrawerProps) {
  const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'estafeta_axofacil' | 'propria_loja'>('estafeta_axofacil');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  if (!isOpen) return null;

  const subtotalMT = items.reduce((acc, item) => acc + item.unitPriceMT * item.quantity, 0);

  const isHospedagemCart = items.length > 0 && items.every(item => item.bookingDurationLabel || item.category === 'hospedagem' || item.category === 'Quartos' || item.category === 'Suítes');

  // Delivery fee calculation
  const getDeliveryFee = () => {
    if (items.length === 0 || isHospedagemCart || deliveryOption === 'pickup') return 0;
    if (deliveryOption === 'propria_loja') return 150;
    return 200; // Estafeta Axofácil default
  };

  const deliveryFeeMT = getDeliveryFee();
  const totalAmountMT = subtotalMT + deliveryFeeMT;

  // Group items by establishment
  const establishmentName = items.length > 0 ? items[0].establishmentName : 'Lojas Axofácil';
  const establishmentId = items.length > 0 ? items[0].establishmentId : undefined;

  const isStoreStaff = isAuthorizedStoreStaffOrAdmin(currentUser);

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-ink/60 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="bg-paper w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-ink/10"
        >
          {/* Drawer Header */}
          <div className="p-5 border-b border-ink/10 flex justify-between items-center bg-sand-1/60">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#0A1E3F] text-white rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-serif font-bold text-lg text-ink">
                  {isStoreStaff ? 'Carrinha & Pedidos da Loja' : 'Minha Carrinha de Compras'}
                </h3>
                <p className="text-xs text-ink/60 truncate max-w-[240px]">
                  {items.length > 0 ? establishmentName : 'Artigos Requisitados & Pedidos Presenciais'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-ink/60 hover:text-ink hover:bg-ink/5 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-sand-2 text-ink/40 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-bold text-ink">A tua carrinha está vazia</p>
                  <p className="text-xs text-ink/60 max-w-xs mx-auto mt-1">
                    Explore os produtos e promoções das lojas e clique em <strong>Pedir Presencial / Carrinha</strong> para requisitar artigos.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="py-2 px-5 bg-indigo-deep hover:bg-indigo-brand text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  Explorar Catálogos
                </button>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs text-ink/60 border-b border-ink/10 pb-2">
                    <span>Artigos selecionados ({items.length})</span>
                    <button
                      onClick={onClearCart}
                      className="text-terracotta hover:underline font-semibold cursor-pointer"
                    >
                      Limpar tudo
                    </button>
                  </div>

                  {items.map((item, idx) => (
                    <div
                      key={`${item.id || 'cart'}-${idx}`}
                      className="p-3 bg-sand-1/40 rounded-2xl border border-ink/10 flex items-center gap-3"
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-14 h-14 object-cover rounded-xl shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-brand rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                          PROD
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-ink truncate">{item.productName}</div>
                        
                        {/* Hospedagem / Booking details badge */}
                        {(item.bookingDurationLabel || item.bookingTime || item.bookingDate || item.bookingGuests) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.bookingDurationLabel && (
                              <span className="text-[9.5px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                                {item.bookingDurationLabel}
                              </span>
                            )}
                            {item.bookingTime && (
                              <span className="text-[9.5px] bg-indigo-50 text-indigo-900 font-bold px-1.5 py-0.5 rounded">
                                🕒 {item.bookingTime}
                              </span>
                            )}
                            {item.bookingDate && (
                              <span className="text-[9.5px] bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded">
                                📅 {item.bookingDate}
                              </span>
                            )}
                            {item.bookingGuests && (
                              <span className="text-[9.5px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                👥 {item.bookingGuests} Hóspedes
                              </span>
                            )}
                          </div>
                        )}

                        <div className="text-xs font-serif text-terracotta font-bold mt-0.5">
                          {item.unitPriceMT} MT
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="inline-flex items-center bg-paper border border-ink/10 rounded-lg p-0.5">
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-sand-2 text-ink rounded-md transition-all cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-ink">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:bg-sand-2 text-ink rounded-md transition-all cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-ink/40 hover:text-terracotta p-1 cursor-pointer transition-all"
                            title="Remover artigo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs font-bold text-ink text-right">
                        {item.unitPriceMT * item.quantity} MT
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Selector */}
                <div className="space-y-3 border-t border-ink/10 pt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink/70 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-indigo-brand" />
                    Opção de Entrega em Maputo
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryOption('estafeta_axofacil')}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                        deliveryOption === 'estafeta_axofacil'
                          ? 'border-indigo-brand bg-indigo-50/50 text-indigo-deep'
                          : 'border-ink/10 bg-paper text-ink/70 hover:bg-sand-1/50'
                      }`}
                    >
                      <div className="font-bold">Estafeta Axofácil</div>
                      <div className="text-[10px] text-ink/60">200 MT</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryOption('propria_loja')}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                        deliveryOption === 'propria_loja'
                          ? 'border-indigo-brand bg-indigo-50/50 text-indigo-deep'
                          : 'border-ink/10 bg-paper text-ink/70 hover:bg-sand-1/50'
                      }`}
                    >
                      <div className="font-bold">Entrega Loja</div>
                      <div className="text-[10px] text-ink/60">150 MT</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryOption('pickup')}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                        deliveryOption === 'pickup'
                          ? 'border-indigo-brand bg-indigo-50/50 text-indigo-deep'
                          : 'border-ink/10 bg-paper text-ink/70 hover:bg-sand-1/50'
                      }`}
                    >
                      <div className="font-bold">Presencial / Balcão</div>
                      <div className="text-[10px] text-emerald-600 font-bold">Grátis (No Local / Mesa)</div>
                    </button>
                  </div>

                  {deliveryOption !== 'pickup' && (
                    <div>
                      <label className="block text-[11px] font-bold text-ink/70 mb-1">
                        Endereço de Entrega (Bairro / Rua / Ponto de Referência)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Av. Eduardo Mondlane, nº 450, Bairro Central"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-paper border border-ink/20 rounded-xl text-xs text-ink focus:outline-none focus:border-indigo-brand"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="p-5 border-t border-ink/10 bg-sand-1/60 space-y-3">
              <div className="space-y-1.5 text-xs bg-paper p-3 rounded-xl border border-ink/10">
                <div className="flex justify-between text-ink/70">
                  <span>Subtotal Produtos (c/ IVA):</span>
                  <span className="font-semibold">{subtotalMT} MT</span>
                </div>
                <div className="flex justify-between text-ink/60 text-[11px] pl-2 border-l-2 border-emerald-500">
                  <span>↳ Inclui Imposto IVA (16%):</span>
                  <span className="text-emerald-800 font-semibold">{subtotalMT - Math.round(subtotalMT / 1.16)} MT</span>
                </div>
                <div className="flex justify-between text-ink/70">
                  <span>Taxa de Entrega:</span>
                  <span>{deliveryFeeMT > 0 ? `${deliveryFeeMT} MT` : 'Grátis'}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-indigo-deep pt-1.5 border-t border-ink/10">
                  <span>Total Final a Pagar:</span>
                  <span className="text-xl font-serif text-terracotta">{totalAmountMT} MT</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!currentUser) {
                    if (onRequireAuth) onRequireAuth('Finalizar Encomendas e Pagamentos');
                    return;
                  }
                  setShowCheckoutModal(true);
                }}
                className="w-full py-3.5 px-6 bg-indigo-deep hover:bg-indigo-brand text-paper font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Avançar para Pagamento Assistido</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Render Checkout Modal */}
      {showCheckoutModal && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => {
            setShowCheckoutModal(false);
            onClose();
          }}
          items={items}
          subtotalMT={subtotalMT}
          deliveryFeeMT={deliveryFeeMT}
          deliveryOption={deliveryOption}
          deliveryAddress={deliveryAddress}
          establishmentId={establishmentId}
          establishmentName={establishmentName}
          targetType={establishmentId ? 'loja' : 'plataforma'}
          currentUser={currentUser}
          onSuccessSubmitted={() => {
            onClearCart();
          }}
        />
      )}
    </>
  );
}
