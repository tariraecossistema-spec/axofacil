import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, ShieldCheck, ShoppingBag, Store, Wine, 
  Home as HomeIcon, Hammer, Wrench, Truck, User, Search, 
  Filter, Phone, Mail, MapPin, Edit3, Trash2, CheckCircle2, 
  X, Check, Lock, Sparkles, Building, Compass
} from 'lucide-react';
import { UserProfile, Establishment } from "../../types/types";
import { loadUserProfiles, saveUserProfiles, addUserProfile, updateUserProfile, deleteUserProfile, purgeTestUserProfiles } from "../../data/userProfiles";
import { notify, confirmDialog } from "../../services/dialogs";

interface AdminUserProfilesProps {
  establishments: Establishment[];
}

export default function AdminUserProfiles({ establishments }: AdminUserProfilesProps) {
  const [users, setUsers] = useState<UserProfile[]>(() => loadUserProfiles());
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Form State for New User
  const [newName, setNewName] = useState('');
  const [newEmailOrPhone, setNewEmailOrPhone] = useState('');
  const [newPhone, setNewPhone] = useState('+258 ');
  const [newCity, setNewCity] = useState('Maputo');
  const [newRole, setNewRole] = useState<UserProfile['role']>('loja');
  const [newStoreName, setNewStoreName] = useState('');
  const [newEstablishmentId, setNewEstablishmentId] = useState('');
  const [newSubscriptionPlan, setNewSubscriptionPlan] = useState('Plano Ouro Pro');

  const refreshUsers = () => {
    setUsers(loadUserProfiles());
  };

  useEffect(() => {
    const handleUpdate = () => refreshUsers();
    window.addEventListener('axofacil_users_updated', handleUpdate);
    return () => window.removeEventListener('axofacil_users_updated', handleUpdate);
  }, []);

  // Filtered Users
  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'todos' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (u.name || '').toLowerCase().includes(q);
      const matchEmail = (u.email || u.emailOrPhone || '').toLowerCase().includes(q);
      const matchPhone = (u.phone || '').includes(q);
      const matchStore = (u.storeName || u.clientOrStoreName || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchStore) return false;
    }
    return true;
  });

  // KPI calculations
  const totalUsers = users.length;
  const merchantsCount = users.filter(u => ['loja', 'supermercado', 'bar', 'hospedagem', 'hotel', 'construcao', 'pecas_auto', 'turismo'].includes(u.role)).length;
  const couriersCount = users.filter(u => u.role === 'entregador').length;
  const clientsCount = users.filter(u => u.role === 'cliente').length;

  // Open Create or Edit Modal
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setNewName('');
    setNewEmailOrPhone('');
    setNewPhone('+258 ');
    setNewCity('Maputo');
    setNewRole('loja');
    setNewStoreName('');
    setNewEstablishmentId('');
    setNewSubscriptionPlan('Plano Ouro Pro');
    setShowAddModal(true);
  };

  const handleOpenEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setNewName(u.name || '');
    setNewEmailOrPhone(u.emailOrPhone || u.email || u.phone || '');
    setNewPhone(u.phone || '+258 ');
    setNewCity(u.city || 'Maputo');
    setNewRole(u.role || 'loja');
    setNewStoreName(u.storeName || u.clientOrStoreName || '');
    setNewEstablishmentId(u.establishmentId || '');
    setNewSubscriptionPlan(u.subscriptionPlan || 'Plano Ouro Pro');
    setShowAddModal(true);
  };

  // Add or Update User Handler
  const handleCreateUser = () => {
    if (!newName.trim()) {
      notify('Indique o nome do utilizador.', 'warning');
      return;
    }
    if (!newEmailOrPhone.trim()) {
      notify('Indique o email ou telefone de acesso.', 'warning');
      return;
    }

    const linkedEst = establishments.find(e => e.id === newEstablishmentId);
    const resolvedStoreName = newStoreName.trim() || linkedEst?.name || undefined;

    if (editingUser) {
      const updatedUser: UserProfile = {
        ...editingUser,
        name: newName.trim(),
        displayName: newName.trim(),
        emailOrPhone: newEmailOrPhone.trim(),
        email: newEmailOrPhone.includes('@') ? newEmailOrPhone.trim() : editingUser.email,
        phone: newPhone.trim() || newEmailOrPhone.trim(),
        city: newCity,
        role: newRole,
        storeName: resolvedStoreName,
        clientOrStoreName: resolvedStoreName,
        establishmentId: newEstablishmentId || undefined,
        subscriptionPlan: newSubscriptionPlan
      };
      updateUserProfile(updatedUser);
      refreshUsers();
      setEditingUser(null);
      setShowAddModal(false);
      notify(`Perfil de "${updatedUser.name}" atualizado com sucesso!`, 'success');
      return;
    }

    const newUser: UserProfile = {
      id: `usr_${Date.now().toString().slice(-6)}`,
      name: newName.trim(),
      displayName: newName.trim(),
      emailOrPhone: newEmailOrPhone.trim(),
      email: newEmailOrPhone.includes('@') ? newEmailOrPhone.trim() : undefined,
      phone: newPhone.trim() || newEmailOrPhone.trim(),
      city: newCity,
      role: newRole,
      storeName: resolvedStoreName,
      clientOrStoreName: resolvedStoreName,
      establishmentId: newEstablishmentId || undefined,
      isPremium: true,
      subscriptionPlan: newSubscriptionPlan,
      created_at: new Date().toISOString()
    };

    addUserProfile(newUser);
    refreshUsers();

    // Reset Form
    setNewName('');
    setNewEmailOrPhone('');
    setNewPhone('+258 ');
    setNewStoreName('');
    setNewEstablishmentId('');
    setShowAddModal(false);

    notify(`Utilizador "${newUser.name}" registado com sucesso!`, 'success');
  };


  // Delete User Handler
  const handleDeleteUser = async (u: UserProfile) => {
    if (u.role === 'admin') {
      notify('Não é possível eliminar a conta de Administrador Geral.', 'warning');
      return;
    }
    const ok = await confirmDialog(`Tem certeza que deseja eliminar o utilizador "${u.name}"?`, {
      title: 'Eliminar Utilizador',
      confirmLabel: 'Sim, Eliminar',
      cancelLabel: 'Cancelar',
      danger: true
    });
    if (!ok) return;

    deleteUserProfile(u.id || u.emailOrPhone);
    refreshUsers();
    notify(`Utilizador "${u.name}" eliminado com sucesso.`, 'info');
  };

  // Open WhatsApp
  const handleOpenWhatsApp = (phoneStr?: string) => {
    if (!phoneStr) return;
    let clean = phoneStr.replace(/\D/g, '');
    if (!clean.startsWith('258') && clean.length === 9) clean = `258${clean}`;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent('Olá! Entramos em contacto da equipa de suporte e administração do Portal Axofácil! Moçambique.')}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Gestão de Contas, Perfis & Registos</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
            Controlo de Utilizadores & Perfis de Acesso
          </h2>
          <p className="text-sm text-white/70 max-w-2xl mt-1">
            Faça a gestão de todas as contas registadas: <strong>Lojistas</strong>, <strong>Estafetas</strong>, <strong>Administradores</strong> e <strong>Clientes</strong>, com atribuição de lojas e planos de subscrição.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenCreateUser}
            className="px-6 py-3 rounded-xl text-xs font-bold bg-[#0B254B] hover:bg-[#0c2e5c] text-white transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-900/20 font-black whitespace-nowrap border border-blue-400/40"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registar Novo Perfil / Usuário</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total de Usuários</span>
            <span className="text-2xl font-serif font-black text-slate-900 mt-1 block">{totalUsers}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Registos na Base de Dados</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lojistas & Parceiros</span>
            <span className="text-2xl font-serif font-black text-indigo-900 mt-1 block">{merchantsCount}</span>
            <span className="text-[11px] text-indigo-600 font-semibold mt-0.5 block">Comércios & Serviços</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estafetas & Frotas</span>
            <span className="text-2xl font-serif font-black text-emerald-700 mt-1 block">{couriersCount}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Moto-Boy e Fretes</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clientes Consumidores</span>
            <span className="text-2xl font-serif font-black text-amber-700 mt-1 block">{clientsCount}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Compradores no Portal</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        
        {/* Role Filter */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Perfil:</span>
          </span>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'loja', label: 'Lojas' },
            { id: 'supermercado', label: 'Supermercados' },
            { id: 'turismo', label: 'Turismo' },
            { id: 'pecas_auto', label: 'Peças Auto' },
            { id: 'entregador', label: 'Estafetas' },
            { id: 'cliente', label: 'Clientes' },
            { id: 'admin', label: 'Admins' },
          ].map((r, idx) => (
            <button
              key={`role-tab-${r.id}-${idx}`}
              onClick={() => setRoleFilter(r.id)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === r.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, telefone..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-indigo-600 outline-none"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Utilizador & Nome</th>
                <th className="py-3.5 px-4">Função / Perfil (Role)</th>
                <th className="py-3.5 px-4">Contacto & Cidade</th>
                <th className="py-3.5 px-4">Loja / Negócio Associado</th>
                <th className="py-3.5 px-4">Plano & Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u, idx) => {
                const isAdmin = u.role === 'admin';
                return (
                  <tr 
                    key={`user-row-${u.id || 'usr'}-${idx}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isAdmin ? 'bg-purple-700 text-white' :
                          u.role === 'entregador' ? 'bg-emerald-600 text-white' :
                          u.role === 'cliente' ? 'bg-amber-600 text-white' : 'bg-indigo-600 text-white'
                        }`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{u.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {u.id || `usr-${idx}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        isAdmin ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                        u.role === 'entregador' ? 'bg-teal-100 text-teal-900 border border-teal-200' :
                        u.role === 'cliente' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                        u.role === 'turismo' ? 'bg-cyan-100 text-cyan-900 border border-cyan-200' :
                        'bg-indigo-100 text-indigo-900 border border-indigo-200'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>

                    {/* Contact & City */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-slate-800 block">{u.phone || u.emailOrPhone}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{u.city || 'Maputo'}</span>
                      </span>
                    </td>

                    {/* Associated Store */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {u.storeName || u.clientOrStoreName ? (
                        <div>
                          <span className="font-bold text-slate-900 block">{u.storeName || u.clientOrStoreName}</span>
                          <span className="text-[10px] text-slate-400">{u.serviceName || 'Comércio Parceiro'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                        {u.subscriptionPlan || (isAdmin ? 'Administrador' : 'Ativo')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.phone && (
                          <button
                            onClick={() => handleOpenWhatsApp(u.phone)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all cursor-pointer"
                            title="Conversar no WhatsApp"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="p-1.5 rounded-lg text-[#0B254B] hover:bg-slate-100 transition-all cursor-pointer"
                          title="Editar perfil de utilizador"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {!isAdmin && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Eliminar perfil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-serif font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0B254B]" />
                <span>{editingUser ? `Editar Perfil: ${editingUser.name}` : 'Registar Novo Perfil / Utilizador'}</span>
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setEditingUser(null); }}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Completo / Responsável *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ex: Fátima Mondlane"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email ou Telefone de Acesso *
                  </label>
                  <input
                    type="text"
                    value={newEmailOrPhone}
                    onChange={(e) => setNewEmailOrPhone(e.target.value)}
                    placeholder="ex: fatima@gmail.com ou 841234567"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Telefone WhatsApp
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+258 84 123 4567"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Função / Papel na Plataforma
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                  >
                    <option value="loja">Loja & Moda</option>
                    <option value="supermercado">Supermercado & Frescos</option>
                    <option value="turismo">Turismo & Logística</option>
                    <option value="pecas_auto">Peças Auto & Mecânica</option>
                    <option value="bar">Bar & Restaurante</option>
                    <option value="hospedagem">Hotel & Hospedagem</option>
                    <option value="construcao">Material de Construção</option>
                    <option value="entregador">Estafeta / Entregador</option>
                    <option value="cliente">Cliente Consumidor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cidade / Província
                  </label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Maputo"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              {newRole !== 'cliente' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Nome da Loja / Empresa
                      </label>
                      <input
                        type="text"
                        value={newStoreName}
                        onChange={(e) => setNewStoreName(e.target.value)}
                        placeholder="ex: Boutique Maputo"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Plano de Subscrição
                      </label>
                      <select
                        value={newSubscriptionPlan}
                        onChange={(e) => setNewSubscriptionPlan(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                      >
                        <option value="Plano Ouro Pro">Plano Premium VIP + Entrega (1.500 MT/mês)</option>
                        <option value="Plano Prata">Plano Pro Destaque (1.000 MT/mês)</option>
                        <option value="Plano Bronze">Plano Base (600 MT/mês)</option>
                        <option value="Estafeta Credenciado">Estafeta Credenciado</option>
                        <option value="Período Experimental (15 dias)">Período Experimental (15 Dias)</option>
                      </select>
                    </div>
                  </div>

                  {establishments.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Vincular a Estabelecimento do Diretório (Opcional)
                      </label>
                      <select
                        value={newEstablishmentId}
                        onChange={(e) => {
                          setNewEstablishmentId(e.target.value);
                          const match = establishments.find(est => est.id === e.target.value);
                          if (match && !newStoreName.trim()) {
                            setNewStoreName(match.name);
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                      >
                        <option value="">— Nenhum vínculo direto —</option>
                        {establishments.map(est => (
                          <option key={`link-est-${est.id}`} value={est.id}>
                            {est.name} ({est.category.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => { setShowAddModal(false); setEditingUser(null); }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                className="px-6 py-2 bg-[#0B254B] hover:bg-[#0c2e5c] text-white font-black text-xs rounded-xl cursor-pointer shadow-md"
              >
                {editingUser ? 'Guardar Alterações' : 'Criar Perfil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
