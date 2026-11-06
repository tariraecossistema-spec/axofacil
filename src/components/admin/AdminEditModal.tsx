import React, { useState, useEffect } from 'react';
import { Establishment, Category, ProductItem } from "../../types/types";
import { uploadFileToStorage as uploadToImgBB } from "../../services/supabase";
import { confirmDialog } from "../../services/dialogs";
import { getProductFallbackImage } from "../../data/data";
import StoreLocationMap from '../shared/StoreLocationMap';
import { X, Upload, Trash2, CheckCircle, Image as ImageIcon, Sparkles, Loader2, Plus, ShoppingBag, Layers, Settings, Check, MapPin, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishmentToEdit?: Establishment | null; // null = Create Mode
  categoryHint?: Category;
  onSave: (est: Establishment) => void;
  onDelete?: (id: string) => void;
}

export default function AdminEditModal({
  isOpen,
  onClose,
  establishmentToEdit,
  categoryHint = 'loja',
  onSave,
  onDelete
}: AdminEditModalProps) {
  const [activeTab, setActiveTab] = useState<'geral' | 'imagens' | 'catalogo'>('geral');

  // Textual and Profile fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('loja');
  const [province, setProvince] = useState<string>('Cidade de Maputo');
  const [zone, setZone] = useState('Baixa da Cidade');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [landmarks, setLandmarks] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [metaInfo, setMetaInfo] = useState('');
  const [promotion, setPromotion] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [features, setFeatures] = useState('');
  const [salesType, setSalesType] = useState<'grosso' | 'retalho' | 'ambos'>('ambos');
  const [segment, setSegment] = useState('Vestuário & Moda');
  const [productsListStr, setProductsListStr] = useState('');
  const [hasIntegratedDelivery, setHasIntegratedDelivery] = useState(true);
  const [subscriptionPlanType, setSubscriptionPlanType] = useState<'basico' | 'pro' | 'premium_delivery' | 'bronze' | 'prata' | 'ouro'>('premium_delivery');
  
  // Gallery and Catalog
  const [gallery, setGallery] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [productsCatalog, setProductsCatalog] = useState<ProductItem[]>([]);

  // Product Add/Edit Form State inside Admin
  const [showAddProd, setShowAddProd] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState<number>(0);
  const [pPromoPrice, setPPromoPrice] = useState<number>(0);
  const [pIsPromo, setPIsPromo] = useState(false);
  const [pCategory, setPCategory] = useState('Geral');
  const [pDesc, setPDesc] = useState('');
  const [pImageUrl, setPImageUrl] = useState('');
  const [pUploading, setPUploading] = useState(false);

  // General Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (establishmentToEdit) {
      setName(establishmentToEdit.name);
      setCategory(establishmentToEdit.category);
      setProvince(establishmentToEdit.province || 'Cidade de Maputo');
      setZone(establishmentToEdit.zone);
      setAddress(establishmentToEdit.address);
      setLatitude(establishmentToEdit.latitude);
      setLongitude(establishmentToEdit.longitude);
      setLandmarks(establishmentToEdit.locationLandmarks || '');
      setDescription(establishmentToEdit.description);
      setPhone(establishmentToEdit.contactPhone || '');
      setMetaInfo(establishmentToEdit.metaInfo);
      setPromotion(establishmentToEdit.promotion || '');
      setImageUrl(establishmentToEdit.imageUrl || '');
      setFeatures(establishmentToEdit.features ? establishmentToEdit.features.join(', ') : '');
      setSalesType(establishmentToEdit.salesType || 'ambos');
      setSegment(establishmentToEdit.segment || (establishmentToEdit.category === 'loja' ? 'Vestuário & Moda' : establishmentToEdit.category === 'bar' ? 'Bares & Diversão' : 'Hospedagem & Hotéis'));
      setProductsListStr(establishmentToEdit.productsList ? establishmentToEdit.productsList.join(', ') : '');
      setHasIntegratedDelivery(establishmentToEdit.hasIntegratedDelivery !== undefined ? establishmentToEdit.hasIntegratedDelivery : true);
      setSubscriptionPlanType(establishmentToEdit.subscriptionPlanType || 'premium_delivery');
      setGallery(establishmentToEdit.gallery || []);
      setProductsCatalog(establishmentToEdit.productsCatalog || []);
    } else {
      // Create mode
      setName('');
      setCategory(categoryHint);
      setProvince('Cidade de Maputo');
      setZone(categoryHint === 'loja' ? 'Baixa da Cidade' : categoryHint === 'bar' ? 'Polana' : 'Sommerschield');
      setAddress('Av. 25 de Setembro, Maputo');
      setLatitude(-25.9692);
      setLongitude(32.5732);
      setLandmarks('');
      setDescription('');
      setPhone('+258 84 ');
      setMetaInfo(categoryHint === 'loja' ? 'Aberto agora' : categoryHint === 'bar' ? 'Aberto até 2h' : 'Diária: 2.000 MT');
      setPromotion('');
      setImageUrl('');
      setFeatures(categoryHint === 'loja' ? 'Têxtil, Baixa da Cidade' : categoryHint === 'bar' ? 'Música ao vivo, Petiscos' : 'Wi-Fi, Vista para o mar');
      setSalesType('ambos');
      setSegment(categoryHint === 'loja' ? 'Vestuário & Moda' : categoryHint === 'bar' ? 'Bares & Diversão' : 'Hospedagem & Hotéis');
      setProductsListStr('');
      setHasIntegratedDelivery(true);
      setSubscriptionPlanType('premium_delivery');
      setGallery([]);
      setProductsCatalog([]);
    }
  }, [establishmentToEdit, categoryHint, isOpen]);

  if (!isOpen) return null;

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(false);

    try {
      const uploadedUrl = await uploadToImgBB(file);
      setImageUrl(uploadedUrl);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleAddGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const url = await uploadToImgBB(file);
        if (url) urls.push(url);
      }
      setGallery(prev => [...urls, ...prev]);
    } catch (err) {
      console.error('Error adding gallery files:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleAddGalleryUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryUrl.trim()) return;
    setGallery(prev => [newGalleryUrl.trim(), ...prev]);
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryPhoto = (index: number) => {
    setGallery(prev => prev.filter((_, i) => i !== index));
  };

  const handleProdImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPUploading(true);
    try {
      const uploadedUrl = await uploadToImgBB(file);
      setPImageUrl(uploadedUrl);
    } catch (err) {
      console.error('Failed to upload product image:', err);
    } finally {
      setPUploading(false);
    }
  };

  const handleAddProdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim() || !pPrice) return;

    if (editingProdId) {
      setProductsCatalog(prev => prev.map(p => p.id === editingProdId ? {
        ...p,
        name: pName.trim(),
        priceMT: Number(pPrice),
        promoPriceMT: pPromoPrice ? Number(pPromoPrice) : undefined,
        isPromo: pIsPromo,
        category: pCategory || 'Geral',
        imageUrl: pImageUrl.trim() || undefined,
        description: pDesc.trim() || undefined
      } : p));
    } else {
      const newProd: ProductItem = {
        id: 'prod_' + Date.now(),
        name: pName.trim(),
        priceMT: Number(pPrice),
        promoPriceMT: pPromoPrice ? Number(pPromoPrice) : undefined,
        isPromo: pIsPromo,
        category: pCategory || 'Geral',
        imageUrl: pImageUrl.trim() || undefined,
        description: pDesc.trim() || undefined
      };
      setProductsCatalog(prev => [newProd, ...prev]);
    }

    // Reset Form
    setEditingProdId(null);
    setPName('');
    setPPrice(0);
    setPPromoPrice(0);
    setPIsPromo(false);
    setPCategory('Geral');
    setPDesc('');
    setPImageUrl('');
    setShowAddProd(false);
  };

  const handleOpenEditProduct = (prod: ProductItem) => {
    setEditingProdId(prod.id);
    setPName(prod.name);
    setPPrice(prod.priceMT);
    setPPromoPrice(prod.promoPriceMT || 0);
    setPIsPromo(!!prod.isPromo);
    setPCategory(prod.category || 'Geral');
    setPDesc(prod.description || '');
    setPImageUrl(prod.imageUrl || '');
    setShowAddProd(true);
  };

  const handleDeleteProduct = (id: string) => {
    setProductsCatalog(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const feats = features ? features.split(',').map(f => f.trim()).filter(Boolean) : [zone];

    const defaultColors: Record<Category, string> = {
      loja: '#0B254B',
      supermercado: '#0F5132',
      bar: '#0B254B',
      hospedagem: '#0B254B',
      construcao: '#78350F',
      turismo: '#0E7490',
      pecas_auto: '#1E293B',
      ferragens: '#57534E',
      entregador: '#B45309'
    };

    const prods = productsListStr ? productsListStr.split(',').map(p => p.trim()).filter(Boolean) : [];

    const updatedEst: Establishment = {
      id: establishmentToEdit ? establishmentToEdit.id : 'est_' + Date.now(),
      name: name.trim(),
      category: category,
      province: province,
      zone: zone.trim() || 'Maputo',
      address: address.trim() || 'Maputo, Moçambique',
      latitude: latitude,
      longitude: longitude,
      addressText: address.trim(),
      locationLandmarks: landmarks.trim() || undefined,
      description: description.trim(),
      rating: establishmentToEdit ? establishmentToEdit.rating : 4.8,
      metaInfo: metaInfo.trim() || 'Aberto agora',
      promotion: promotion.trim() || undefined,
      coverColor: establishmentToEdit ? establishmentToEdit.coverColor : defaultColors[category],
      imageUrl: imageUrl.trim() || undefined,
      gallery: gallery,
      productsCatalog: productsCatalog,
      features: feats,
      contactPhone: phone.trim(),
      whatsappLink: phone.trim() ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Olá,%20vi%20o%20vosso%20anúncio%20no%20Axofácil!` : undefined,
      salesType,
      segment,
      productsList: prods,
      isActive: establishmentToEdit?.isActive !== undefined ? establishmentToEdit.isActive : true,
      hasIntegratedDelivery,
      subscriptionPlanType,
      visits: establishmentToEdit ? establishmentToEdit.visits : 120,
      searches: establishmentToEdit ? establishmentToEdit.searches : 45,
      salesOrReservations: establishmentToEdit ? establishmentToEdit.salesOrReservations : 18
    };

    onSave(updatedEst);
    onClose();
  };

  const handleDeleteClick = async () => {
    if (establishmentToEdit && onDelete) {
      const ok = await confirmDialog(`Tens a certeza que desejas eliminar "${establishmentToEdit.name}" permanentemente?`, { danger: true, confirmLabel: 'Eliminar', title: '⚠️ Atenção' });
      if (ok) {
        onDelete(establishmentToEdit.id);
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-indigo-deep/60 backdrop-blur-xs z-60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-paper border border-ink/15 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative z-10 p-5 sm:p-6 flex flex-col my-auto max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-ink/10 pb-3 mb-4 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  👑 Gestão de Administrador Geral
                </span>
              </div>
              <h2 className="font-serif font-bold text-xl text-indigo-deep flex items-center gap-2 mt-1">
                <Sparkles className="w-5 h-5 text-terracotta" />
                <span>{establishmentToEdit ? `Editar Perfil: ${establishmentToEdit.name}` : 'Adicionar Novo Estabelecimento'}</span>
              </h2>
              <p className="text-xs text-ink/60 mt-0.5">Gestão total de textos, fotos da vitrine, galeria e catálogo de produtos/serviços</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-sand-2/40 text-ink/40 hover:text-ink cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs inside Admin Modal */}
          <div className="flex items-center gap-2 border-b border-ink/10 pb-2 mb-4 shrink-0 overflow-x-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('geral')}
              className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'geral' 
                  ? 'bg-indigo-deep text-white shadow-2xs' 
                  : 'bg-white text-ink/60 hover:bg-sand-2/40 border border-ink/10'
              }`}
            >
              <Settings className="w-4 h-4 text-sand" />
              <span>Dados Principais & Contactos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('imagens')}
              className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'imagens' 
                  ? 'bg-indigo-deep text-white shadow-2xs' 
                  : 'bg-white text-ink/60 hover:bg-sand-2/40 border border-ink/10'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-terracotta" />
              <span>Capa & Galeria da Vitrine ({gallery.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('catalogo')}
              className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'catalogo' 
                  ? 'bg-indigo-deep text-white shadow-2xs' 
                  : 'bg-white text-ink/60 hover:bg-sand-2/40 border border-ink/10'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Catálogo & Serviços ({productsCatalog.length})</span>
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-grow">
            
            {/* TAB 1: DADOS GERAIS */}
            {activeTab === 'geral' && (
              <div className="space-y-4 text-xs">
                {/* Category selection */}
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Categoria de Registo *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['loja', 'supermercado', 'bar', 'hospedagem', 'construcao', 'pecas_auto', 'turismo', 'ferragens'] as Category[]).map((cat, idx) => (
                      <button
                        key={`admin-cat-btn-${cat}-${idx}`}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-2 px-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border truncate ${
                          category === cat 
                            ? cat === 'supermercado' ? 'bg-[#0F5132] text-white border-[#0F5132]' : 'bg-[#0B254B] text-white border-[#0B254B]'
                            : 'bg-white text-ink/60 border-ink/12 hover:bg-sand-2/20'
                        }`}
                      >
                        {cat === 'loja' ? 'Loja' :
                         cat === 'supermercado' ? 'Supermercado' :
                         cat === 'bar' ? 'Bar / Diversão' :
                         cat === 'hospedagem' ? 'Hospedagem' :
                         cat === 'construcao' ? 'Mat. Construção' :
                         cat === 'pecas_auto' ? 'Peças Auto' :
                         cat === 'turismo' ? 'Turismo & Viagens' :
                         'Ferragens'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Nome Oficial do Estabelecimento *</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Loja Baixa Têxtil ou Supermercado VIP"
                    required
                    className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-bold outline-none focus:border-indigo-brand"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Descrição / Biografia Comercial *</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Descreva os produtos, serviços, marcas e especialidades..."
                    required
                    className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-medium outline-none focus:border-indigo-brand font-sans"
                  />
                </div>

                {/* Province, Zone, Phone & Address */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Província / Cidade *</label>
                    <select
                      value={province}
                      onChange={(e) => {
                        const newProv = e.target.value;
                        setProvince(newProv);
                        // Reset lat/lng when province changes so map centers on new city
                        setLatitude(undefined);
                        setLongitude(undefined);
                      }}
                      className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none"
                    >
                      <option value="Cidade de Maputo">Cidade de Maputo</option>
                      <option value="Província de Maputo (Matola/Zimpeto/Boane)">Província de Maputo (Matola/Zimpeto/Boane)</option>
                      <option value="Sofala (Cidade da Beira)">Sofala (Cidade da Beira / Dondo)</option>
                      <option value="Nampula (Cidade de Nampula)">Nampula (Cidade de Nampula / Nacala)</option>
                      <option value="Tete (Cidade de Tete)">Tete (Cidade de Tete / Moatize)</option>
                      <option value="Zambézia (Quelimane)">Zambézia (Quelimane)</option>
                      <option value="Cabo Delgado (Pemba)">Cabo Delgado (Pemba)</option>
                      <option value="Niassa (Lichinga)">Niassa (Lichinga)</option>
                      <option value="Manica (Chimoio)">Manica (Chimoio)</option>
                      <option value="Inhambane (Cidade de Inhambane)">Inhambane (Cidade de Inhambane / Maxixe)</option>
                      <option value="Gaza (Xai-Xai)">Gaza (Xai-Xai)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Zona / Bairro *</label>
                    <input 
                      type="text" 
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      placeholder="ex: Baixa da Cidade, Polana, Matola, Ponta Gêa"
                      required
                      className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Contacto Telefónico / WhatsApp *</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="ex: +258 84 123 4567"
                      className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Endereço Exato</label>
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="ex: Av. Eduardo Mondlane, Centro da Cidade"
                      className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-medium outline-none focus:border-indigo-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Ponto de Referência / Como Chegar</label>
                    <input 
                      type="text" 
                      value={landmarks}
                      onChange={(e) => setLandmarks(e.target.value)}
                      placeholder="ex: Próximo ao BCI, a 50m do Mercado Central"
                      className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-medium outline-none focus:border-indigo-brand"
                    />
                  </div>
                </div>

                {/* OpenStreetMap / Leaflet Geocoding Location Picker for Store Owner */}
                <div className="bg-sand-2/30 p-3.5 rounded-2xl border border-ink/12 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-deep flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-terracotta" />
                      <span>Localização do Estabelecimento (Mapa Interativo & Geocodificação OpenStreetMap)</span>
                    </span>
                    <span className="text-[10px] text-ink/60 font-mono">
                      {name || 'O seu negócio'} · {province} · {zone}
                    </span>
                  </div>

                  <StoreLocationMap
                    mode="picker"
                    storeName={name || 'O seu estabelecimento'}
                    addressText={address || `${zone}, ${province}`}
                    landmarks={landmarks}
                    province={province}
                    latitude={latitude}
                    longitude={longitude}
                    height="220px"
                    onLocationChange={(loc) => {
                      setLatitude(loc.lat);
                      setLongitude(loc.lng);
                      if (loc.addressText && loc.addressText !== address) {
                        setAddress(loc.addressText);
                      }
                    }}
                  />
                </div>

                {/* Segment & Sales Mode (Grosso / Retalho) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-sand-2/30 p-3 rounded-xl border border-ink/10">
                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Segmento do Negócio *</label>
                    <select 
                      value={segment}
                      onChange={(e) => setSegment(e.target.value)}
                      className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none cursor-pointer"
                    >
                      <option value="Vestuário & Moda">Vestuário & Moda</option>
                      <option value="Calçado & Meias">Calçado & Meias</option>
                      <option value="Eletrónicos & Informática">Eletrónicos & Informática</option>
                      <option value="Casa, Louças & Ferramentas">Casa, Louças & Ferramentas</option>
                      <option value="Cosméticos & Perfumaria">Cosméticos & Perfumaria</option>
                      <option value="Supermercado & Alimentação">Supermercado & Alimentação</option>
                      <option value="Bares, Restaurantes & Diversão">Bares, Restaurantes & Diversão</option>
                      <option value="Hospedagem, Hotéis & Alojamento">Hospedagem, Hotéis & Alojamento</option>
                      <option value="Serviços & Outros">Serviços & Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Modalidade de Venda *</label>
                    <select 
                      value={salesType}
                      onChange={(e) => setSalesType(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none cursor-pointer"
                    >
                      <option value="ambos">📦 Grosso & 🛒 Retalho (Ambos)</option>
                      <option value="grosso">🏬 Venda Exclusiva a Grosso</option>
                      <option value="retalho">🛒 Venda Exclusiva a Retalho</option>
                    </select>
                  </div>
                </div>

                {/* Products List Summary */}
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Resumo de Linhas de Artigos (separados por vírgula)</label>
                  <input 
                    type="text" 
                    value={productsListStr}
                    onChange={(e) => setProductsListStr(e.target.value)}
                    placeholder="ex: Fatos masculinos, Meias em lote, Capulanas, Sapatos"
                    className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-medium outline-none focus:border-indigo-brand"
                  />
                </div>

                {/* Meta Info & Promotion */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Horário / Diária / Info de Balcão *</label>
                    <input 
                      type="text" 
                      value={metaInfo}
                      onChange={(e) => setMetaInfo(e.target.value)}
                      placeholder="ex: Aberto agora · Fecha às 18h / Diária: 1.800 MT"
                      required
                      className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Texto de Oferta / Promoção Principal</label>
                    <input 
                      type="text" 
                      value={promotion}
                      onChange={(e) => setPromotion(e.target.value)}
                      placeholder="ex: −20% em capulanas estampadas este mês"
                      className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Tags / Destaques da Loja (separadas por vírgula)</label>
                  <input 
                    type="text" 
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    placeholder="ex: Capulanas, Baixa da Cidade, Entrega Grátis"
                    className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-medium outline-none focus:border-indigo-brand"
                  />
                </div>

                {/* Subscription Plan & Delivery (Admin Control) */}
                <div className="bg-sand-2/30 p-4 rounded-xl border border-ink/12 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-deep uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-terracotta" />
                    <span>Plano de Subscrição & Configuração de Entrega</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-ink/70 mb-1">Tipo de Plano Atribuído pelo Portal</label>
                      <select
                        value={subscriptionPlanType}
                        onChange={(e) => setSubscriptionPlanType(e.target.value as any)}
                        className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none cursor-pointer"
                      >
                        <option value="basico">Plano Base (600 MT/mês)</option>
                        <option value="pro">Plano Pro Destaque (1.000 MT/mês)</option>
                        <option value="premium_delivery">Plano Premium VIP + Entrega (1.500 MT/mês)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={hasIntegratedDelivery}
                          onChange={(e) => setHasIntegratedDelivery(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                      <span className="text-xs font-bold text-ink">
                        🚚 Serv. Entrega Sincronizado (Estafetas)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: IMAGENS DE CAPA E GALERIA */}
            {activeTab === 'imagens' && (
              <div className="space-y-6 text-xs">
                
                {/* 1. COVER IMAGE BLOCK */}
                <div className="bg-sand-2/20 p-4 rounded-xl border border-ink/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-indigo-deep uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-terracotta" />
                      <span>Imagem de Capa Principal (Banner do Front-End)</span>
                    </label>
                    {uploadSuccess && (
                      <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Upload com sucesso!</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <label className="bg-indigo-deep text-paper hover:bg-indigo-brand py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-2xs">
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-sand" />
                          <span>A carregar no servidor...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-sand" />
                          <span>Upload do Dispositivo</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleCoverFileChange}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>

                    <input 
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Ou cole aqui o URL da imagem da capa (http...)"
                      className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-medium focus:border-indigo-brand outline-none"
                    />
                  </div>

                  {imageUrl && (
                    <div className="relative rounded-xl overflow-hidden border border-ink/12 h-40 bg-black/5">
                      <img src={imageUrl} alt="Preview Capa" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 right-2 text-[9px] font-bold bg-indigo-deep/80 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">
                        Capa Atual em Exibição
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. GALLERY PHOTOS BLOCK */}
                <div className="bg-white p-4 rounded-xl border border-ink/12 space-y-4">
                  <div className="flex justify-between items-center border-b border-ink/10 pb-2">
                    <div>
                      <h3 className="font-serif font-bold text-sm text-indigo-deep">Galeria de Fotos da Vitrine ({gallery.length})</h3>
                      <p className="text-[11px] text-ink/60">Carregue fotos reais das instalações, prateleiras, quartos ou ambiente do local</p>
                    </div>

                    <label className="bg-terracotta hover:bg-terracotta/90 text-white font-bold text-xs py-2 px-3.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-2xs">
                      <Upload className="w-4 h-4" />
                      <span>Adicionar Fotos</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleAddGalleryFile} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  {/* Add URL input */}
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      value={newGalleryUrl} 
                      onChange={(e) => setNewGalleryUrl(e.target.value)} 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddGalleryUrl(e);
                        }
                      }}
                      placeholder="Ou insira o URL de uma foto para a galeria..." 
                      className="flex-grow p-2.5 bg-paper border border-ink/12 rounded-xl text-xs font-medium outline-none focus:border-indigo-brand"
                    />
                    <button 
                      type="button" 
                      onClick={(e) => handleAddGalleryUrl(e)}
                      className="py-2.5 px-4 bg-indigo-deep hover:bg-indigo-brand text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>

                  {/* Gallery Grid */}
                  {gallery.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-ink/15 rounded-xl text-xs text-ink/50 italic">
                      Nenhuma foto adicional na galeria. Clique acima para adicionar fotos do estabelecimento.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {gallery.map((photo, idx) => (
                        <div key={`edit-gallery-img-${idx}`} className="relative h-28 rounded-xl overflow-hidden border border-ink/12 group bg-sand-2/20">
                          <img src={photo} alt={`Galeria ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <button 
                            type="button" 
                            onClick={() => handleRemoveGalleryPhoto(idx)} 
                            className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-lg opacity-90 hover:opacity-100 transition-opacity cursor-pointer shadow-md" 
                            title="Remover foto da galeria"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 3: CATÁLOGO DE PRODUTOS & SERVIÇOS */}
            {activeTab === 'catalogo' && (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-ink/10 pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-base text-indigo-deep flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      <span>Catálogo de Produtos, Pacotes & Serviços ({productsCatalog.length})</span>
                    </h3>
                    <p className="text-[11px] text-ink/60">Gira e adicione itens com foto, preço e ofertas de promoção</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {productsCatalog.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setProductsCatalog([])}
                        className="py-2 px-3 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Limpar Catálogo</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProdId(null);
                        setPName('');
                        setPPrice(0);
                        setPPromoPrice(0);
                        setPIsPromo(false);
                        setPCategory('Geral');
                        setPDesc('');
                        setPImageUrl('');
                        setShowAddProd(!showAddProd);
                      }}
                      className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Produto / Serviço</span>
                    </button>
                  </div>
                </div>

                {/* Add/Edit product form inside modal */}
                {showAddProd && (
                  <div className="bg-sand-2/30 border border-emerald-300/80 p-4 rounded-xl space-y-3">
                    <div className="font-bold text-indigo-deep text-xs border-b border-ink/10 pb-1 flex justify-between items-center">
                      <span>{editingProdId ? 'Editar Item do Catálogo' : 'Novo Item do Catálogo'}</span>
                      <button type="button" onClick={() => { setShowAddProd(false); setEditingProdId(null); }} className="text-ink/40 hover:text-ink"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-ink/70 mb-1">Nome do Item *</label>
                        <input 
                          type="text" 
                          value={pName} 
                          onChange={(e) => setPName(e.target.value)} 
                          placeholder="ex: Fardo de Capulana 24m, Quarto Executivo" 
                          required 
                          className="w-full p-2.5 bg-white border border-ink/12 rounded-xl outline-none font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-ink/70 mb-1">Categoria do Artigo</label>
                        <input 
                          type="text" 
                          value={pCategory} 
                          onChange={(e) => setPCategory(e.target.value)} 
                          placeholder="ex: Vestuário, Bebidas, Diária" 
                          className="w-full p-2.5 bg-white border border-ink/12 rounded-xl outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-ink/70 mb-1">Preço Normal (MT) *</label>
                        <input 
                          type="number" 
                          value={pPrice || ''} 
                          onChange={(e) => setPPrice(parseFloat(e.target.value) || 0)} 
                          placeholder="ex: 1200" 
                          required 
                          className="w-full p-2.5 bg-white border border-ink/12 rounded-xl outline-none font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-ink/70 mb-1">Descrição Curta</label>
                        <input 
                          type="text" 
                          value={pDesc} 
                          onChange={(e) => setPDesc(e.target.value)} 
                          placeholder="ex: Algodão puro, alta resistência" 
                          className="w-full p-2.5 bg-white border border-ink/12 rounded-xl outline-none font-medium"
                        />
                      </div>
                    </div>

                    {/* Image upload for product */}
                    <div className="bg-white p-3 rounded-xl border border-ink/10 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block font-bold text-ink/70">Imagem do Produto (Link URL ou Upload Ficheiro)</label>
                        {pImageUrl && (
                          <button
                            type="button"
                            onClick={() => setPImageUrl('')}
                            className="text-[10px] text-red-600 font-bold hover:underline"
                          >
                            Limpar Foto
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <label className="py-2.5 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0 shadow-2xs flex items-center gap-1.5 transition-all">
                          {pUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          <span>Upload Ficheiro</span>
                          <input type="file" accept="image/*" onChange={handleProdImageFileChange} className="hidden" />
                        </label>
                        <input 
                          type="url" 
                          value={pImageUrl} 
                          onChange={(e) => setPImageUrl(e.target.value)} 
                          placeholder="Ou cole o link da imagem (http...)" 
                          className="flex-grow p-2.5 bg-paper border border-ink/12 rounded-xl outline-none font-medium text-xs"
                        />
                      </div>

                      {/* Preset suggestion chips */}
                      {!pImageUrl && (
                        <div className="pt-1 flex items-center gap-1.5 overflow-x-auto text-[10px] font-bold text-ink/60">
                          <span>Preset rápido:</span>
                          {[
                            { name: 'Geral', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400' },
                            { name: 'Cimento', url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400' },
                            { name: 'Peça Auto', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=400' },
                            { name: 'Bebidas', url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=400' },
                            { name: 'Vestuário', url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=400' }
                          ].map((preset, idx) => (
                            <button
                              key={`admin-preset-img-${preset.name}-${idx}`}
                              type="button"
                              onClick={() => setPImageUrl(preset.url)}
                              className="py-0.5 px-2 bg-sand-2 hover:bg-emerald-100 border border-ink/10 rounded-md whitespace-nowrap cursor-pointer transition-colors"
                            >
                              + {preset.name}
                            </button>
                          ))}
                        </div>
                      )}

                      {pImageUrl && (
                        <div className="mt-2 flex items-center gap-3 bg-sand-2/30 p-2 rounded-lg border border-ink/10">
                          <div className="h-14 w-20 rounded-md overflow-hidden border border-ink/10 shrink-0 bg-black/5">
                            <img src={pImageUrl} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[10px] text-ink/60 truncate font-mono">{pImageUrl}</span>
                        </div>
                      )}
                    </div>

                    {/* Promo Option */}
                    <div className="flex items-center gap-4 bg-white p-2.5 rounded-xl border border-ink/10">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-indigo-deep">
                        <input 
                          type="checkbox" 
                          checked={pIsPromo} 
                          onChange={(e) => setPIsPromo(e.target.checked)} 
                          className="w-4 h-4 rounded text-terracotta"
                        />
                        <span>Em Promoção</span>
                      </label>

                      {pIsPromo && (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink/70">Preço Oferta (MT):</span>
                          <input 
                            type="number" 
                            value={pPromoPrice || ''} 
                            onChange={(e) => setPPromoPrice(parseFloat(e.target.value) || 0)} 
                            placeholder="ex: 950" 
                            className="p-1.5 bg-sand-2/40 border border-ink/15 rounded-lg text-xs font-bold w-28"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button 
                        type="button" 
                        onClick={() => setShowAddProd(false)} 
                        className="py-2 px-3 bg-white border border-ink/15 rounded-xl font-bold"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="button" 
                        onClick={handleAddProdSubmit} 
                        className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-2xs"
                      >
                        Guardar Item
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Products */}
                {productsCatalog.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-ink/15 rounded-xl text-xs text-ink/50 italic">
                    Nenhum produto registado no catálogo. Clique em "Adicionar Produto / Serviço" para cadastrar artigos.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {productsCatalog.map((prod, pIdx) => {
                      const prodImage = prod.imageUrl || getProductFallbackImage(prod.name, prod.category);
                      return (
                        <div key={`${prod.id || 'prod'}-${pIdx}`} className="bg-white border border-ink/12 rounded-xl p-3 flex gap-3 items-center justify-between shadow-2xs hover:border-indigo-brand transition-all">
                          <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-sand-2/30 border border-ink/10">
                            <img src={prodImage} alt={prod.name} className="w-full h-full object-cover" />
                          </div>

                          <div className="flex-grow space-y-0.5 min-w-0">
                            <span className="text-[9px] font-bold text-ink/40 uppercase tracking-wider block">{prod.category || 'Geral'}</span>
                            <h4 className="font-bold text-xs text-indigo-deep truncate">{prod.name}</h4>
                            <div className="text-xs font-serif font-bold text-emerald-700 flex items-center gap-1.5">
                              {prod.isPromo && prod.promoPriceMT ? (
                                <>
                                  <span className="text-terracotta">{prod.promoPriceMT} MT</span>
                                  <span className="line-through text-ink/40 text-[10px]">{prod.priceMT} MT</span>
                                </>
                              ) : (
                                <span>{prod.priceMT} MT</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button 
                              type="button" 
                              onClick={() => handleOpenEditProduct(prod)} 
                              className="p-2 text-indigo-deep hover:bg-indigo-deep/10 rounded-lg transition-colors cursor-pointer" 
                              title="Editar produto"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteProduct(prod.id)} 
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                              title="Remover produto do catálogo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Modal Bottom Controls */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-ink/10 flex-shrink-0">
              {establishmentToEdit && onDelete ? (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="btn bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200/80 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                  title="Eliminar esta loja permanentemente"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Loja</span>
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn bg-paper border border-ink/15 py-2.5 px-4 rounded-xl text-xs font-semibold text-ink cursor-pointer hover:bg-sand-2/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || pUploading}
                  className="btn bg-indigo-deep hover:bg-indigo-brand text-paper py-2.5 px-6 rounded-xl text-xs font-bold cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-sand" />
                  <span>{establishmentToEdit ? 'Gravar Alterações' : 'Guardar Estabelecimento'}</span>
                </button>
              </div>
            </div>

          </form>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
