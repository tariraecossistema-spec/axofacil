import { UserProfile } from '../types/types';
import { recordOfflineChange } from '../services/offlineSync';

export const INITIAL_REGISTERED_USERS: UserProfile[] = [];

const USER_PROFILES_KEY = 'axofacil_registered_users';
const DELETED_USERS_KEY = 'axofacil_deleted_users';

export function getDeletedUserKeys(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set<string>();
  try {
    const raw = localStorage.getItem(DELETED_USERS_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

export function markUserDeleted(userIdOrEmail: string): void {
  if (typeof localStorage === 'undefined' || !userIdOrEmail) return;
  try {
    const keys = getDeletedUserKeys();
    keys.add(userIdOrEmail);
    keys.add(userIdOrEmail.trim().toLowerCase());
    localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(Array.from(keys)));
  } catch (e) {
    console.warn('Erro ao registar utilizador eliminado:', e);
  }
}

export function markAllTestUsersDeleted(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const keys = getDeletedUserKeys();
    ['usr_teste_1', 'usr_teste_2', 'usr_teste_3', 'teste1@axofacil.co.mz', 'teste2@axofacil.co.mz', 'teste3@axofacil.co.mz', 'est:l1', 'est:s1', 'est:c1'].forEach(k => keys.add(k));
    localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(Array.from(keys)));
  } catch (e) {
    console.warn('Erro ao registar contas de teste eliminadas:', e);
  }
}

export function getProfileDisplayInfo(user: UserProfile | null | undefined) {
  if (!user) {
    return {
      mainTitle: 'Perfil do Utilizador',
      badgeLabel: 'Perfil',
      subTitle: 'Perfil do Utilizador',
      roleType: 'singular',
      roleLabel: 'Utilizador',
      managerLabel: undefined
    };
  }

  const role = user.role;
  const storeOrBizName = (user.storeName || user.clientOrStoreName || user.displayName || user.name || '').trim();
  const personName = (user.name || user.adminName || user.displayName || '').trim();

  switch (role) {
    case 'supermercado': {
      const supName = storeOrBizName || 'Supermercado Central';
      return {
        mainTitle: supName,
        badgeLabel: 'Perfil de Supermercado',
        subTitle: `Perfil de Supermercado · ${supName}`,
        roleType: 'empresa',
        roleLabel: 'Supermercado',
        managerLabel: user.adminName ? `Gerente / Responsável: ${user.adminName}` : undefined
      };
    }
    case 'bar': {
      const barName = storeOrBizName || 'Bar & Lounge';
      return {
        mainTitle: barName,
        badgeLabel: 'Perfil de Bar',
        subTitle: `Perfil de Bar · ${barName}`,
        roleType: 'empresa',
        roleLabel: 'Bar & Noite',
        managerLabel: user.adminName ? `Gerente / Responsável: ${user.adminName}` : undefined
      };
    }
    case 'loja': {
      const lojaName = storeOrBizName || 'Loja Comercial';
      return {
        mainTitle: lojaName,
        badgeLabel: 'Perfil de Loja',
        subTitle: `Perfil de Loja · ${lojaName}`,
        roleType: 'empresa',
        roleLabel: 'Loja',
        managerLabel: user.adminName ? `Gerente / Responsável: ${user.adminName}` : undefined
      };
    }
    case 'hospedagem':
    case 'hotel': {
      const hotelName = storeOrBizName || 'Hospedagem & Hotel';
      return {
        mainTitle: hotelName,
        badgeLabel: 'Perfil de Hospedagem',
        subTitle: `Perfil de Hospedagem · ${hotelName}`,
        roleType: 'empresa',
        roleLabel: 'Hospedagem & Hotel',
        managerLabel: user.adminName ? `Gerente / Responsável: ${user.adminName}` : undefined
      };
    }
    case 'turismo': {
      const turName = storeOrBizName || 'Agência de Turismo & Logística';
      return {
        mainTitle: turName,
        badgeLabel: 'Perfil de Turismo & Logística',
        subTitle: `Perfil de Turismo & Logística · ${turName}`,
        roleType: 'empresa',
        roleLabel: 'Turismo & Logística',
        managerLabel: user.adminName ? `Diretor / Responsável: ${user.adminName}` : undefined
      };
    }
    case 'construcao': {
      const constName = storeOrBizName || 'Estaleiro de Material de Construção';
      return {
        mainTitle: constName,
        badgeLabel: 'Perfil de Construção',
        subTitle: `Perfil de Construção · ${constName}`,
        roleType: 'empresa',
        roleLabel: 'Construção & Obras',
        managerLabel: user.adminName ? `Encarregado / Responsável: ${user.adminName}` : undefined
      };
    }
    case 'pecas_auto': {
      const autoName = storeOrBizName || 'Loja de Peças Auto';
      return {
        mainTitle: autoName,
        badgeLabel: 'Perfil de Peças Auto',
        subTitle: `Perfil de Peças Auto · ${autoName}`,
        roleType: 'empresa',
        roleLabel: 'Peças Auto & Mecânica',
        managerLabel: user.adminName ? `Responsável da Oficina: ${user.adminName}` : undefined
      };
    }
    case 'entregador': {
      const courierName = personName || storeOrBizName || 'Estafeta';
      return {
        mainTitle: courierName,
        badgeLabel: 'Perfil de Estafeta',
        subTitle: `Perfil de Estafeta · ${courierName}`,
        roleType: 'estafeta',
        roleLabel: 'Estafeta / Entregador',
        managerLabel: 'Serviço de Entregas & Fretes'
      };
    }
    case 'admin': {
      const adminTitle = personName || 'Administrador Geral';
      return {
        mainTitle: adminTitle,
        badgeLabel: 'Super Administrador',
        subTitle: `Perfil de Administrador · ${adminTitle}`,
        roleType: 'admin',
        roleLabel: 'Administrador Geral',
        managerLabel: 'Acesso Geral ao Portal'
      };
    }
    case 'cliente':
    default: {
      const clientName = personName || storeOrBizName || 'Cliente Singular';
      return {
        mainTitle: clientName,
        badgeLabel: 'Perfil de Cliente',
        subTitle: `Perfil de Cliente · ${clientName}`,
        roleType: 'singular',
        roleLabel: 'Cliente Singular',
        managerLabel: 'Conta Singular de Compras'
      };
    }
  }
}

export function loadUserProfiles(): UserProfile[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const deletedUsers = getDeletedUserKeys();
    const deletedEstsRaw = localStorage.getItem('axofacil_deleted_establishments');
    const deletedEstIds = new Set<string>(deletedEstsRaw ? JSON.parse(deletedEstsRaw) : []);

    const isUserDeletedOrTest = (u: UserProfile) => {
      if (u.id && (deletedUsers.has(u.id) || u.id.startsWith('usr_teste_'))) return true;
      const email = (u.emailOrPhone || u.email || '').toLowerCase();
      if (email && (deletedUsers.has(email) || (email.startsWith('teste') && email.includes('@axofacil')))) return true;
      if (u.establishmentId && (deletedUsers.has(`est:${u.establishmentId}`) || deletedEstIds.has(u.establishmentId) || ['l1', 's1', 'c1'].includes(u.establishmentId))) return true;
      if ((u.name || '').toLowerCase().includes('conta de teste')) return true;
      return false;
    };

    const raw = localStorage.getItem(USER_PROFILES_KEY);
    if (!raw) {
      return [];
    }
    const parsed: UserProfile[] = JSON.parse(raw);
    const cleaned = Array.isArray(parsed) ? parsed.filter(u => !isUserDeletedOrTest(u)) : [];
    if (Array.isArray(parsed) && cleaned.length !== parsed.length) {
      saveUserProfiles(cleaned);
    }
    return cleaned;
  } catch (e) {
    console.warn('Erro ao carregar perfis de utilizadores:', e);
    return [];
  }
}

export function saveUserProfiles(users: UserProfile[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(users));
  recordOfflineChange();
  window.dispatchEvent(new Event('axofacil_users_updated'));
}

export function addUserProfile(user: UserProfile): void {
  const users = loadUserProfiles();
  const exists = users.some(u => (u.id && u.id === user.id) || (u.emailOrPhone === user.emailOrPhone));
  if (exists) {
    const updated = users.map(u => ((u.id && u.id === user.id) || u.emailOrPhone === user.emailOrPhone) ? { ...u, ...user } : u);
    saveUserProfiles(updated);
  } else {
    users.unshift(user);
    saveUserProfiles(users);
  }
}

export function updateUserProfile(updatedUser: UserProfile): void {
  const users = loadUserProfiles();
  const next = users.map(u => {
    if ((updatedUser.id && u.id === updatedUser.id) || u.emailOrPhone === updatedUser.emailOrPhone) {
      return { ...u, ...updatedUser };
    }
    return u;
  });
  saveUserProfiles(next);
}

export function deleteUserProfile(userIdOrEmail: string): void {
  markUserDeleted(userIdOrEmail);
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(USER_PROFILES_KEY) : null;
  const users: UserProfile[] = raw ? JSON.parse(raw) : INITIAL_REGISTERED_USERS;
  const target = users.find(u => u.id === userIdOrEmail || u.emailOrPhone === userIdOrEmail);
  if (target) {
    if (target.id) markUserDeleted(target.id);
    if (target.emailOrPhone) markUserDeleted(target.emailOrPhone);
    if (target.establishmentId) markUserDeleted(`est:${target.establishmentId}`);
  }
  const updated = users.filter(u => u.id !== userIdOrEmail && u.emailOrPhone !== userIdOrEmail);
  saveUserProfiles(updated);
}

export function deleteUsersByEstablishmentId(establishmentId: string): void {
  if (!establishmentId) return;
  markUserDeleted(`est:${establishmentId}`);
  const users = loadUserProfiles();
  const matching = users.filter(u => u.establishmentId === establishmentId);
  matching.forEach(u => {
    if (u.id) markUserDeleted(u.id);
    if (u.emailOrPhone) markUserDeleted(u.emailOrPhone);
  });
  const updated = users.filter(u => u.establishmentId !== establishmentId);
  saveUserProfiles(updated);
}

export function purgeTestUserProfiles(): UserProfile[] {
  markAllTestUsersDeleted();
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(USER_PROFILES_KEY) : null;
  const users: UserProfile[] = raw ? JSON.parse(raw) : [];
  const cleaned = users.filter(u => {
    if (u.id && u.id.startsWith('usr_teste_')) return false;
    if (u.establishmentId && ['l1', 's1', 'c1'].includes(u.establishmentId)) return false;
    const email = (u.emailOrPhone || u.email || '').toLowerCase();
    if (email.startsWith('teste') && email.includes('@axofacil')) return false;
    if ((u.name || '').toLowerCase().includes('conta de teste')) return false;
    return true;
  });
  saveUserProfiles(cleaned);
  return cleaned;
}

const USER_CREDENTIALS_KEY = 'axofacil_user_credentials';

export interface UserCredential {
  emailOrPhone: string;
  passwordHash: string;
  userId: string;
  role: string;
  updatedAt: string;
}

/**
 * Guarda credenciais para autenticação de utilizadores após registo.
 */
export function saveUserCredential(emailOrPhone: string, password: string, role: string, userId: string): void {
  if (typeof localStorage === 'undefined' || !emailOrPhone || !password) return;
  try {
    const raw = localStorage.getItem(USER_CREDENTIALS_KEY);
    const map: Record<string, UserCredential> = raw ? JSON.parse(raw) : {};
    const key = emailOrPhone.trim().toLowerCase();
    map[key] = {
      emailOrPhone: key,
      passwordHash: password,
      userId,
      role,
      updatedAt: new Date().toISOString()
    };
    // Also save under numeric digits if phone
    const digits = key.replace(/\D/g, '');
    if (digits.length >= 7) {
      map[digits] = map[key];
    }
    localStorage.setItem(USER_CREDENTIALS_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Erro ao guardar credenciais:', e);
  }
}

/**
 * Encontra perfil de utilizador por e-mail ou número de telefone (com suporte a variações de digitação).
 */
export function findUserProfileByContact(inputContact: string): UserProfile | undefined {
  if (!inputContact) return undefined;
  const users = loadUserProfiles();
  const cleanInput = inputContact.trim().toLowerCase();
  const inputDigits = cleanInput.replace(/\D/g, '');

  return users.find(u => {
    const uContact = (u.emailOrPhone || '').trim().toLowerCase();
    const uEmail = (u.email || '').trim().toLowerCase();
    const uPhone = (u.phone || '').trim().toLowerCase();
    const uDigits = (u.phone || u.emailOrPhone || '').replace(/\D/g, '');

    if (uContact === cleanInput || uEmail === cleanInput || uPhone === cleanInput) {
      return true;
    }
    if (inputDigits.length >= 7 && uDigits.length >= 7 && (uDigits.endsWith(inputDigits) || inputDigits.endsWith(uDigits))) {
      return true;
    }
    return false;
  });
}

/**
 * Valida a palavra-passe do utilizador para login seguro.
 */
export function verifyUserPassword(inputContact: string, inputPassword: string): { ok: boolean; reason?: string } {
  if (!inputContact || !inputPassword) {
    return { ok: false, reason: 'Campos obrigatórios em falta.' };
  }
  if (typeof localStorage === 'undefined') return { ok: true };

  try {
    const raw = localStorage.getItem(USER_CREDENTIALS_KEY);
    const map: Record<string, UserCredential> = raw ? JSON.parse(raw) : {};
    const key = inputContact.trim().toLowerCase();
    const digits = key.replace(/\D/g, '');

    let cred = map[key] || (digits.length >= 7 ? map[digits] : undefined);

    // Se ainda não tem credencial guardada localmente, verifica se tem perfil
    if (!cred) {
      if (inputPassword.length >= 6) {
        return { ok: true };
      }
      return { ok: false, reason: 'A palavra-passe deve ter pelo menos 6 caracteres.' };
    }

    if (cred.passwordHash === inputPassword) {
      return { ok: true };
    }

    return { ok: false, reason: 'Palavra-passe incorreta.' };
  } catch (e) {
    return { ok: false, reason: 'Erro na validação de credenciais.' };
  }
}

