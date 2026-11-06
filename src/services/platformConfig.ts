import { syncPlatformSettingsToSupabase, fetchPlatformSettingsFromSupabase } from './supabase';

const STORAGE_KEY = 'axofacil_platform_settings_cache';

export interface PlatformPaymentAccount {
  titular: string;
  numero: string;
  banco?: string;
}

export interface PlatformPaymentAccounts {
  mpesa: PlatformPaymentAccount;
  emola: PlatformPaymentAccount;
  banco: PlatformPaymentAccount;
}

export interface SubscriptionPlanDetails {
  name: string;
  priceMT: number;
}

export interface BusinessPlans {
  bronze: SubscriptionPlanDetails;
  prata: SubscriptionPlanDetails;
  ouro: SubscriptionPlanDetails;
}

export interface ClientPlans {
  mensal: SubscriptionPlanDetails;
  semestral: SubscriptionPlanDetails;
  anual: SubscriptionPlanDetails;
}

export interface PlatformSettings {
  paymentAccounts: PlatformPaymentAccounts;
  businessPlans: BusinessPlans;
  clientPlans: ClientPlans;
}

// DEFINIR: Os números de M-Pesa, e-Mola e NIB bancário da plataforma devem ser configurados
// pelo administrador em `platform_settings` na base de dados (Painel de Administração -> Definições).
// Enquanto estiverem em branco, o checkout apresenta "Pagamento indisponível".
export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  paymentAccounts: {
    mpesa: {
      titular: '',
      numero: ''
    },
    emola: {
      titular: '',
      numero: ''
    },
    banco: {
      titular: '',
      numero: '',
      banco: ''
    }
  },
  businessPlans: {
    bronze: { name: 'Plano Base — Estabelecimento no Directório', priceMT: 600 },
    prata: { name: 'Plano Pro Destaque — Prioridade na Pesquisa', priceMT: 1000 },
    ouro: { name: 'Plano Empresarial + Entregas', priceMT: 1500 }
  },
  clientPlans: {
    mensal: { name: 'Acesso Cliente — Mensal', priceMT: 150 },
    semestral: { name: 'Acesso Cliente — Semestral (6 Meses)', priceMT: 500 },
    anual: { name: 'Acesso Cliente — Anual (12 Meses)', priceMT: 1200 }
  }
};

function mergeWithDefaults(saved: Partial<PlatformSettings> | null): PlatformSettings {
  if (!saved) return DEFAULT_PLATFORM_SETTINGS;
  return {
    paymentAccounts: {
      mpesa: { ...DEFAULT_PLATFORM_SETTINGS.paymentAccounts.mpesa, ...(saved.paymentAccounts?.mpesa || {}) },
      emola: { ...DEFAULT_PLATFORM_SETTINGS.paymentAccounts.emola, ...(saved.paymentAccounts?.emola || {}) },
      banco: { ...DEFAULT_PLATFORM_SETTINGS.paymentAccounts.banco, ...(saved.paymentAccounts?.banco || {}) }
    },
    businessPlans: {
      bronze: { ...DEFAULT_PLATFORM_SETTINGS.businessPlans.bronze, ...(saved.businessPlans?.bronze || {}) },
      prata: { ...DEFAULT_PLATFORM_SETTINGS.businessPlans.prata, ...(saved.businessPlans?.prata || {}) },
      ouro: { ...DEFAULT_PLATFORM_SETTINGS.businessPlans.ouro, ...(saved.businessPlans?.ouro || {}) }
    },
    clientPlans: {
      mensal: { ...DEFAULT_PLATFORM_SETTINGS.clientPlans.mensal, ...(saved.clientPlans?.mensal || {}) },
      semestral: { ...DEFAULT_PLATFORM_SETTINGS.clientPlans.semestral, ...(saved.clientPlans?.semestral || {}) },
      anual: { ...DEFAULT_PLATFORM_SETTINGS.clientPlans.anual, ...(saved.clientPlans?.anual || {}) }
    }
  };
}

let inMemorySettings: PlatformSettings = DEFAULT_PLATFORM_SETTINGS;

export function loadPlatformSettings(): PlatformSettings {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return inMemorySettings;
    inMemorySettings = mergeWithDefaults(JSON.parse(raw));
    return inMemorySettings;
  } catch {
    return inMemorySettings;
  }
}

export function savePlatformSettings(settings: PlatformSettings): void {
  inMemorySettings = settings;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  } catch {
    // Preferências em memória caso storage esteja indisponível
  }
  syncPlatformSettingsToSupabase({
    paymentAccounts: settings.paymentAccounts,
    businessPlans: settings.businessPlans,
    clientPlans: settings.clientPlans
  }).catch((err) => {
    console.error('Erro ao guardar definições da plataforma:', err);
  });
}

export async function hydratePlatformSettingsFromSupabase(): Promise<PlatformSettings> {
  try {
    const remote = await fetchPlatformSettingsFromSupabase();
    if (remote) {
      const merged = mergeWithDefaults(remote as Partial<PlatformSettings>);
      inMemorySettings = merged;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    }
  } catch {
    // Mantém definições em cache caso não haja ligação
  }
  return loadPlatformSettings();
}
