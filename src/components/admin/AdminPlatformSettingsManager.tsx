import React, { useState, useEffect } from 'react';
import {
  Save, Smartphone, Building2, Landmark, Store, Users, RotateCcw, ShieldCheck, Cloud, CloudOff
} from 'lucide-react';
import {
  loadPlatformSettings, savePlatformSettings, hydratePlatformSettingsFromSupabase, DEFAULT_PLATFORM_SETTINGS,
  PlatformSettings
} from '../../services/platformConfig';
import { isSupabaseConfigured } from '../../services/supabase';
import { confirmDialog, notify } from '../../services/dialogs';

// Painel de administração para editar, sem tocar em código:
//  - As contas de recebimento da plataforma (M-Pesa, e-Mola, Transferência Bancária)
//  - Os preços e nomes dos planos de assinatura (Empresas/Lojas e Clientes)
//
// Tudo é guardado em localStorage (chave "axofacil_platform_settings") e lido
// automaticamente por paymentConfig.ts e SubscriptionPaymentModal.tsx, pelo
// que qualquer alteração aqui reflete-se de imediato no checkout dos clientes.
export default function AdminPlatformSettingsManager() {
  const [settings, setSettings] = useState<PlatformSettings>(() => loadPlatformSettings());
  const [savedPulse, setSavedPulse] = useState(false);
  const [isSyncing, setIsSyncing] = useState(isSupabaseConfigured);

  // Ao abrir este ecrã, vai sempre buscar a versão mais recente ao Supabase
  // (caso outro admin tenha alterado algo noutro dispositivo entretanto).
  useEffect(() => {
    let cancelled = false;
    if (!isSupabaseConfigured) return;
    setIsSyncing(true);
    hydratePlatformSettingsFromSupabase()
      .then(fresh => { if (!cancelled) setSettings(fresh); })
      .finally(() => { if (!cancelled) setIsSyncing(false); });
    return () => { cancelled = true; };
  }, []);

  const update = (updater: (prev: PlatformSettings) => PlatformSettings) => {
    setSettings(prev => updater(prev));
  };

  const handleSave = () => {
    savePlatformSettings(settings);
    setSavedPulse(true);
    setTimeout(() => setSavedPulse(false), 1500);
    notify('Definições da plataforma actualizadas com sucesso!', 'success');
  };

  const handleReset = async () => {
    const ok = await confirmDialog('Repor todos os valores por defeito (contas e planos)? Esta ação não pode ser desfeita.');
    if (!ok) return;
    setSettings(DEFAULT_PLATFORM_SETTINGS);
    savePlatformSettings(DEFAULT_PLATFORM_SETTINGS);
    notify('Definições repostas para os valores por defeito.', 'info');
  };

  const inputCls = "w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none";
  const labelCls = "block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1";

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#0B254B] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Definições da Plataforma</span>
          </div>
          {isSupabaseConfigured ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-2 ml-2">
              <Cloud className="w-3 h-3" />
              <span>{isSyncing ? 'A sincronizar…' : 'Sincronizado na nuvem'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/60 text-[10px] font-bold uppercase tracking-wider mb-2 ml-2">
              <CloudOff className="w-3 h-3" />
              <span>Apenas neste dispositivo (Supabase não configurado)</span>
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
            Contas de Recebimento & Planos de Assinatura
          </h2>
          <p className="text-sm text-white/70 max-w-2xl mt-1">
            Altere aqui os números de M-Pesa, e-Mola, dados bancários e os preços dos planos de Empresas e Clientes. As alterações aplicam-se de imediato em todo o checkout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-3 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-2 cursor-pointer border border-white/20 whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Repor Padrão</span>
          </button>
          <button
            onClick={handleSave}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg font-black whitespace-nowrap ${
              savedPulse
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-[#0B254B] hover:bg-[#0c2e5c] text-white shadow-blue-900/20 border border-blue-400/40'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{savedPulse ? 'Guardado!' : 'Guardar Alterações'}</span>
          </button>
        </div>
      </div>

      {/* Payment Accounts */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        <h3 className="text-lg font-serif font-black text-slate-900 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#0B254B]" />
          <span>Contas de Recebimento (M-Pesa / e-Mola / Banco)</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* M-Pesa */}
          <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
              <Smartphone className="w-4 h-4" />
              <span>M-Pesa</span>
            </div>
            <div>
              <label className={labelCls}>Titular da Conta</label>
              <input
                type="text"
                className={inputCls}
                value={settings.paymentAccounts.mpesa.titular}
                onChange={(e) => update(prev => ({
                  ...prev,
                  paymentAccounts: { ...prev.paymentAccounts, mpesa: { ...prev.paymentAccounts.mpesa, titular: e.target.value } }
                }))}
              />
            </div>
            <div>
              <label className={labelCls}>Número de Telefone</label>
              <input
                type="text"
                className={`${inputCls} font-mono`}
                value={settings.paymentAccounts.mpesa.numero}
                onChange={(e) => update(prev => ({
                  ...prev,
                  paymentAccounts: { ...prev.paymentAccounts, mpesa: { ...prev.paymentAccounts.mpesa, numero: e.target.value } }
                }))}
                placeholder="ex: 841234567"
              />
            </div>
          </div>

          {/* e-Mola */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <Smartphone className="w-4 h-4" />
              <span>e-Mola</span>
            </div>
            <div>
              <label className={labelCls}>Titular da Conta</label>
              <input
                type="text"
                className={inputCls}
                value={settings.paymentAccounts.emola.titular}
                onChange={(e) => update(prev => ({
                  ...prev,
                  paymentAccounts: { ...prev.paymentAccounts, emola: { ...prev.paymentAccounts.emola, titular: e.target.value } }
                }))}
              />
            </div>
            <div>
              <label className={labelCls}>Número de Telefone</label>
              <input
                type="text"
                className={`${inputCls} font-mono`}
                value={settings.paymentAccounts.emola.numero}
                onChange={(e) => update(prev => ({
                  ...prev,
                  paymentAccounts: { ...prev.paymentAccounts, emola: { ...prev.paymentAccounts.emola, numero: e.target.value } }
                }))}
                placeholder="ex: 871425316"
              />
            </div>
          </div>

          {/* Banco */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
              <Landmark className="w-4 h-4" />
              <span>Transferência Bancária</span>
            </div>
            <div>
              <label className={labelCls}>Nome do Banco</label>
              <input
                type="text"
                className={inputCls}
                value={settings.paymentAccounts.banco.banco || ''}
                onChange={(e) => update(prev => ({
                  ...prev,
                  paymentAccounts: { ...prev.paymentAccounts, banco: { ...prev.paymentAccounts.banco, banco: e.target.value } }
                }))}
                placeholder="ex: Millennium Bim"
              />
            </div>
            <div>
              <label className={labelCls}>Titular da Conta</label>
              <input
                type="text"
                className={inputCls}
                value={settings.paymentAccounts.banco.titular}
                onChange={(e) => update(prev => ({
                  ...prev,
                  paymentAccounts: { ...prev.paymentAccounts, banco: { ...prev.paymentAccounts.banco, titular: e.target.value } }
                }))}
              />
            </div>
            <div>
              <label className={labelCls}>NIB / Nº de Conta</label>
              <input
                type="text"
                className={`${inputCls} font-mono`}
                value={settings.paymentAccounts.banco.numero}
                onChange={(e) => update(prev => ({
                  ...prev,
                  paymentAccounts: { ...prev.paymentAccounts, banco: { ...prev.paymentAccounts.banco, numero: e.target.value } }
                }))}
                placeholder="ex: 000100000017601998457"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Business Plans */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        <h3 className="text-lg font-serif font-black text-slate-900 flex items-center gap-2">
          <Store className="w-5 h-5 text-emerald-600" />
          <span>Planos para Empresas / Lojas</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {(['bronze', 'prata', 'ouro'] as const).map(tier => (
            <div key={tier} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">{tier}</div>
              <div>
                <label className={labelCls}>Nome do Plano</label>
                <input
                  type="text"
                  className={inputCls}
                  value={settings.businessPlans[tier].name}
                  onChange={(e) => update(prev => ({
                    ...prev,
                    businessPlans: { ...prev.businessPlans, [tier]: { ...prev.businessPlans[tier], name: e.target.value } }
                  }))}
                />
              </div>
              <div>
                <label className={labelCls}>Preço Mensal (MT)</label>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={settings.businessPlans[tier].priceMT}
                  onChange={(e) => update(prev => ({
                    ...prev,
                    businessPlans: { ...prev.businessPlans, [tier]: { ...prev.businessPlans[tier], priceMT: Number(e.target.value) || 0 } }
                  }))}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Plans */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        <h3 className="text-lg font-serif font-black text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          <span>Planos para Clientes</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {(['mensal', 'semestral', 'anual'] as const).map(period => (
            <div key={period} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">{period}</div>
              <div>
                <label className={labelCls}>Nome do Plano</label>
                <input
                  type="text"
                  className={inputCls}
                  value={settings.clientPlans[period].name}
                  onChange={(e) => update(prev => ({
                    ...prev,
                    clientPlans: { ...prev.clientPlans, [period]: { ...prev.clientPlans[period], name: e.target.value } }
                  }))}
                />
              </div>
              <div>
                <label className={labelCls}>Preço (MT)</label>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={settings.clientPlans[period].priceMT}
                  onChange={(e) => update(prev => ({
                    ...prev,
                    clientPlans: { ...prev.clientPlans, [period]: { ...prev.clientPlans[period], priceMT: Number(e.target.value) || 0 } }
                  }))}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Save Bar (mobile convenience) */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg font-black whitespace-nowrap ${
            savedPulse
              ? 'bg-emerald-500 text-white shadow-emerald-500/30'
              : 'bg-[#0B254B] hover:bg-[#0c2e5c] text-white shadow-blue-900/20 border border-blue-400/40'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>{savedPulse ? 'Guardado!' : 'Guardar Alterações'}</span>
        </button>
      </div>
    </div>
  );
}
