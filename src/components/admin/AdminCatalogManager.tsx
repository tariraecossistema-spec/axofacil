import React, { useState, useRef } from 'react';
import { 
  Package, Plus, Upload, Link as LinkIcon, Search, Filter, 
  Trash2, Edit3, Check, X, Sparkles, Tag, DollarSign, Store, 
  Layers, ArrowUpDown, AlertTriangle, CheckCircle2, Image as ImageIcon
} from 'lucide-react';
import { Establishment, ProductItem } from "../../types/types";
import { saveEstablishments } from "../../data/data";
import { notify, confirmDialog } from "../../services/dialogs";
import { syncEstablishmentToSupabase, deleteProductFromSupabase, uploadFileToStorage as uploadToImgBB } from "../../services/supabase";

interface AdminCatalogManagerProps {
  establishments: Establishment[];
  onEstablishmentsChange: (updated: Establishment[]) => void;
}

export default function AdminCatalogManager({
  establishments,
  onEstablishmentsChange
}: AdminCatalogManagerProps) {
  const [selectedEstId, setSelectedEstId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{ estId: string; product: ProductItem } | null>(null);

  // Add Product Form State
  const [targetEstId, setTargetEstId] = useState<string>(establishments[0]?.id || '');
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodPriceMT, setProdPriceMT] = useState('');
  const [prodPromoPriceMT, setProdPromoPriceMT] = useState('');
  const [prodStockQty, setProdStockQty] = useState('20');
  const [prodUnitLabel, setProdUnitLabel] = useState('Unidade');
  const [prodDescription, setProdDescription] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flattened products with establishment info (supports both products and productsCatalog)
  const allProducts: Array<{ est: Establishment; product: ProductItem }> = [];
  establishments.forEach(est => {
    const list = (est.products && est.products.length > 0) 
      ? est.products 
      : (est.productsCatalog || []);
    list.forEach(p => {
      allProducts.push({ est, product: p });
    });
  });

  // Filtered list
  const filteredProducts = allProducts.filter(item => {
    if (selectedEstId !== 'all' && item.est.id !== selectedEstId) return false;
    if (categoryFilter !== 'todas' && (item.product.category || '').toLowerCase() !== categoryFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.product.name.toLowerCase().includes(q);
      const matchEst = item.est.name.toLowerCase().includes(q);
      const matchCat = (item.product.category || '').toLowerCase().includes(q);
      if (!matchName && !matchEst && !matchCat) return false;
    }
    return true;
  });

  // Extract distinct categories
  const categoriesList = Array.from(
    new Set(allProducts.map(i => i.product.category).filter(Boolean))
  ) as string[];

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Por favor selecione um ficheiro de imagem válido (JPG, PNG, WebP).', 'warning');
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadToImgBB(file);
      if (uploadedUrl) {
        setProdImageUrl(uploadedUrl);
        notify('Imagem do produto carregada com sucesso!', 'success');
      }
    } catch (err) {
      console.error(err);
      notify('Erro ao carregar imagem. Pode inserir o link direto.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (estId: string, prod: ProductItem) => {
    setEditingProduct({ estId, product: prod });
    setTargetEstId(estId);
    setProdName(prod.name);
    setProdCategory(prod.category || 'Geral');
    setProdPriceMT(prod.priceMT.toString());
    setProdPromoPriceMT(prod.promoPriceMT ? prod.promoPriceMT.toString() : '');
    setProdStockQty((prod.stockQty ?? 10).toString());
    setProdUnitLabel(prod.unitLabel || 'Unidade');
    setProdDescription(prod.description || '');
    setProdImageUrl(prod.imageUrl || '');
    setShowAddModal(true);
  };

  // Submit Add or Edit Product
  const handleSaveProduct = () => {
    if (!prodName.trim()) {
      notify('Indique o nome do produto.', 'warning');
      return;
    }
    const priceNum = parseFloat(prodPriceMT.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      notify('Indique um preço de venda válido em Meticais (MT).', 'warning');
      return;
    }

    const promoNum = prodPromoPriceMT ? parseFloat(prodPromoPriceMT.replace(',', '.')) : undefined;
    const stockNum = parseInt(prodStockQty, 10);

    const savedProd: ProductItem = {
      id: editingProduct ? editingProduct.product.id : `prod-${Date.now().toString().slice(-6)}`,
      name: prodName.trim(),
      priceMT: priceNum,
      promoPriceMT: promoNum && promoNum > 0 ? promoNum : undefined,
      isPromo: !!(promoNum && promoNum > 0),
      isAvailable: (isNaN(stockNum) ? 10 : stockNum) > 0,
      stockQty: isNaN(stockNum) ? 10 : Math.max(0, stockNum),
      unitLabel: prodUnitLabel.trim() || 'Unidade',
      category: prodCategory.trim() || 'Geral',
      description: prodDescription.trim() || 'Artigo disponível no catálogo.',
      imageUrl: prodImageUrl.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
    };

    const targetId = editingProduct ? editingProduct.estId : (targetEstId || establishments[0]?.id);
    const updatedEsts = establishments.map(est => {
      if (est.id === targetId) {
        let prods = [...(est.products && est.products.length > 0 ? est.products : est.productsCatalog || [])];
        let catalog = [...(est.productsCatalog && est.productsCatalog.length > 0 ? est.productsCatalog : est.products || [])];

        if (editingProduct) {
          prods = prods.map(p => p.id === savedProd.id ? savedProd : p);
          catalog = catalog.map(p => p.id === savedProd.id ? savedProd : p);
        } else {
          prods = [savedProd, ...prods];
          catalog = [savedProd, ...catalog];
        }

        return {
          ...est,
          products: prods,
          productsCatalog: catalog
        };
      }
      return est;
    });

    onEstablishmentsChange(updatedEsts);
    saveEstablishments(updatedEsts);
    const targetUpdatedEst = updatedEsts.find(e => e.id === targetId);
    if (targetUpdatedEst) {
      syncEstablishmentToSupabase(targetUpdatedEst).catch(console.warn);
    }
    try {
      localStorage.setItem('axofacil_establishments', JSON.stringify(updatedEsts));
    } catch (e) {}

    // Reset Form
    const isEdit = !!editingProduct;
    setEditingProduct(null);
    setProdName('');
    setProdCategory('');
    setProdPriceMT('');
    setProdPromoPriceMT('');
    setProdStockQty('20');
    setProdUnitLabel('Unidade');
    setProdDescription('');
    setProdImageUrl('');
    setShowAddModal(false);

    notify(
      isEdit 
        ? `Produto "${savedProd.name}" atualizado com sucesso!` 
        : `Produto "${savedProd.name}" adicionado ao catálogo com sucesso!`,
      'success'
    );
  };

  // Adjust Stock directly
  const handleQuickStockAdjust = (estId: string, prodId: string, delta: number) => {
    const updatedEsts = establishments.map(est => {
      if (est.id === estId) {
        const updateList = (list?: ProductItem[]) => (list || []).map(p => {
          if (p.id === prodId) {
            const currentQty = p.stockQty ?? 10;
            const newQty = Math.max(0, currentQty + delta);
            return {
              ...p,
              stockQty: newQty,
              isAvailable: newQty > 0
            };
          }
          return p;
        });

        return {
          ...est,
          products: updateList(est.products || est.productsCatalog),
          productsCatalog: updateList(est.productsCatalog || est.products)
        };
      }
      return est;
    });

    onEstablishmentsChange(updatedEsts);
    saveEstablishments(updatedEsts);
    try {
      localStorage.setItem('axofacil_establishments', JSON.stringify(updatedEsts));
    } catch (e) {}
  };

  // Delete product
  const handleDeleteProduct = async (estId: string, prodId: string, prodName: string) => {
    const ok = await confirmDialog(`Tem certeza que deseja remover o produto "${prodName}" do catálogo?`, {
      title: 'Eliminar Produto do Catálogo',
      confirmLabel: 'Sim, Eliminar',
      cancelLabel: 'Cancelar',
      danger: true
    });
    if (!ok) return;

    deleteProductFromSupabase(prodId).catch(console.warn);
    const updatedEsts = establishments.map(est => {
      if (est.id === estId) {
        const nextEst = {
          ...est,
          products: (est.products || []).filter(p => p.id !== prodId),
          productsCatalog: (est.productsCatalog || []).filter(p => p.id !== prodId)
        };
        syncEstablishmentToSupabase(nextEst).catch(console.warn);
        return nextEst;
      }
      return est;
    });
    onEstablishmentsChange(updatedEsts);
    saveEstablishments(updatedEsts);
    try {
      localStorage.setItem('axofacil_establishments', JSON.stringify(updatedEsts));
    } catch (e) {}
    notify(`Produto "${prodName}" removido do catálogo com sucesso.`, 'info');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Catalog Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Package className="w-3.5 h-3.5" />
            <span>Gestor de Catálogo, Produtos & Estoques</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
            Catálogo Geral de Produtos & Lojas
          </h2>
          <p className="text-sm text-white/70 max-w-2xl mt-1">
            Faça upload de novas imagens de produtos (upload de ficheiro ou link), atualize preços em Meticais (MT), controle estoques e ative promoções em todas as lojas parceiras.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setProdName('');
            setProdCategory('');
            setProdPriceMT('');
            setProdPromoPriceMT('');
            setProdStockQty('20');
            setProdUnitLabel('Unidade');
            setProdDescription('');
            setProdImageUrl('');
            if (selectedEstId !== 'all') {
              setTargetEstId(selectedEstId);
            }
            setShowAddModal(true);
          }}
          className="px-6 py-3 rounded-xl text-xs font-bold bg-[#0B254B] hover:bg-[#061833] text-white transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#0B254B]/20 font-black whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto no Catálogo</span>
        </button>
      </div>

      {/* Filter and Selection Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        
        {/* Establishment Selector */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Store className="w-4 h-4 text-indigo-600" />
            <span>Loja / Estabelecimento:</span>
          </div>
          <select
            value={selectedEstId}
            onChange={(e) => setSelectedEstId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer max-w-xs"
          >
            <option value="all">Todas as Lojas & Serviços ({allProducts.length} Produtos)</option>
            {establishments.map((est, idx) => (
              <option key={`opt-est-${est.id}-${idx}`} value={est.id}>
                {est.name} ({est.products?.length || 0} itens)
              </option>
            ))}
          </select>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-indigo-600 outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="todas">Todas Categorias</option>
            {categoriesList.map((cat, cIdx) => (
              <option key={`cat-${cat}-${cIdx}`} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid / Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Nenhum produto encontrado</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Não existem produtos cadastrados com os filtros atuais. Clique em &quot;Novo Produto no Catálogo&quot; para adicionar com fotos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Foto & Produto</th>
                  <th className="py-3.5 px-4">Loja / Estabelecimento</th>
                  <th className="py-3.5 px-4">Categoria & Unidade</th>
                  <th className="py-3.5 px-4">Preço Venda (MT)</th>
                  <th className="py-3.5 px-4">Estoque Rápido</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(({ est, product }, pIdx) => {
                  const stock = product.stockQty ?? 10;
                  const isLow = stock <= 5;
                  const isOut = stock === 0;

                  return (
                    <tr 
                      key={`prod-row-${est.id}-${product.id}-${pIdx}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Photo & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            {product.isPromo && (
                              <span className="absolute top-0 right-0 bg-rose-600 text-white text-[8px] font-black px-1 rounded-bl">
                                PROMO
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 line-clamp-1 block text-sm">
                              {product.name}
                            </span>
                            {product.description && (
                              <span className="text-[11px] text-slate-400 line-clamp-1">
                                {product.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Store */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 block">{est.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{est.category}</span>
                      </td>

                      {/* Category & Unit */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {product.category || 'Geral'}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-1">
                          {product.unitLabel || 'Unidade'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-serif font-black text-slate-900 block text-sm">
                          {product.priceMT.toLocaleString()} MT
                        </span>
                        {product.promoPriceMT && (
                          <span className="text-[10px] text-rose-600 font-bold line-through block">
                            De {product.promoPriceMT.toLocaleString()} MT
                          </span>
                        )}
                      </td>

                      {/* Stock Adjustment Controls */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickStockAdjust(est.id, product.id, -1)}
                            disabled={stock <= 0}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer disabled:opacity-30"
                            title="Diminuir 1 unidade"
                          >
                            -
                          </button>
                          
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold ${
                            isOut ? 'bg-rose-100 text-rose-800' :
                            isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {stock} un
                          </span>

                          <button
                            onClick={() => handleQuickStockAdjust(est.id, product.id, 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                            title="Adicionar 1 unidade"
                          >
                            +
                          </button>

                          <button
                            onClick={() => handleQuickStockAdjust(est.id, product.id, 10)}
                            className="px-1.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] cursor-pointer"
                            title="Adicionar 10 unidades"
                          >
                            +10
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditProduct(est.id, product)}
                            className="p-2 rounded-xl text-[#0B254B] hover:bg-slate-100 transition-all cursor-pointer"
                            title="Editar produto do catálogo"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(est.id, product.id, product.name)}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Eliminar produto do catálogo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            
            {/* Header */}
            <div className="p-6 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0B254B] text-white font-black flex items-center justify-center text-sm">
                  {editingProduct ? '✎' : '+'}
                </div>
                <div>
                  <h3 className="text-lg font-serif font-black text-white">
                    {editingProduct ? 'Editar Produto do Catálogo' : 'Adicionar Novo Produto ao Catálogo'}
                  </h3>
                  <p className="text-xs text-white/70">
                    {editingProduct ? 'Atualize as informações, fotos e preços do artigo selecionado' : 'Com upload de imagem direta ou inserção de link'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-5">
              
              {/* Target Establishment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Selecione a Loja / Estabelecimento Proprietário:
                </label>
                <select
                  value={targetEstId}
                  onChange={(e) => setTargetEstId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none cursor-pointer"
                >
                  {establishments.map((est, idx) => (
                    <option key={`add-est-${est.id}-${idx}`} value={est.id}>
                      {est.name} ({est.category.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome do Artigo / Produto *
                </label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="ex: Vestido de Gala Seda Azul / Cerveja 2M 500ml / Cimento Limpopo"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none"
                />
              </div>

              {/* Price & Promo Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Preço de Venda (MT) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={prodPriceMT}
                      onChange={(e) => setProdPriceMT(e.target.value)}
                      placeholder="ex: 1500"
                      className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">MT</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Preço Promocional (Opcional)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={prodPromoPriceMT}
                      onChange={(e) => setProdPromoPriceMT(e.target.value)}
                      placeholder="ex: 1200"
                      className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">MT</span>
                  </div>
                </div>
              </div>

              {/* Category, Unit and Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    placeholder="ex: Moda, Bebidas, Obras"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Unidade
                  </label>
                  <input
                    type="text"
                    value={prodUnitLabel}
                    onChange={(e) => setProdUnitLabel(e.target.value)}
                    placeholder="Unidade, Kg, Saco, Litro"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Quantidade em Estoque
                  </label>
                  <input
                    type="number"
                    value={prodStockQty}
                    onChange={(e) => setProdStockQty(e.target.value)}
                    placeholder="20"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Product Photo: Upload Direto ou Link */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#0B254B]" />
                  <span>Foto do Produto (Upload ou Link HTTPS)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                      id="catalog-file-input"
                    />
                    <label
                      htmlFor="catalog-file-input"
                      className={`w-full h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                        isUploading
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700 animate-pulse'
                          : 'border-slate-300 hover:border-indigo-600 bg-white text-slate-700'
                      }`}
                    >
                      <Upload className="w-5 h-5 text-indigo-600" />
                      <span>{isUploading ? 'A carregar...' : 'Upload Direto de Foto'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">PNG, JPG, WebP</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="url"
                        value={prodImageUrl}
                        onChange={(e) => setProdImageUrl(e.target.value)}
                        placeholder="https://exemplo.com/produto.jpg"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                      />
                    </div>
                    {prodImageUrl && (
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-slate-300">
                        <img
                          src={prodImageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Descrição do Artigo
                </label>
                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Detalhes, especificações técnicas, materiais ou modo de utilização..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0B254B] hover:bg-[#061833] text-white cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingProduct ? 'Salvar Alterações' : 'Adicionar ao Catálogo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
