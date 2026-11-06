import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseUserProfileRecord {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  city?: string;
  created_at?: string;
}

const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
const supabaseUrl = (metaEnv.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (metaEnv.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl !== 'https://your-supabase-project.supabase.co'
);

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return clientInstance;
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? getSupabaseClient()
  : null;

const ALLOWED_SIGNUP_ROLES = new Set([
  'cliente',
  'loja',
  'supermercado',
  'bar',
  'hospedagem',
  'construcao',
  'pecas_auto',
  'turismo',
  'entregador'
]);

export function sanitizeSignupRole(role?: string): string {
  if (!role) return 'cliente';
  const clean = role.trim().toLowerCase();
  return ALLOWED_SIGNUP_ROLES.has(clean) ? clean : 'cliente';
}

export async function checkIsAdminInSupabase(userId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !userId) return false;
  try {
    const { data: adminRow } = await client
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (adminRow?.user_id) return true;

    const { data: profileRow } = await client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    return profileRow?.role === 'admin';
  } catch {
    return false;
  }
}

export const handleForgotPassword = async (emailToReset: string): Promise<string> => {
  const cleanEmail = emailToReset.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Introduza o seu endereço de e-mail.');
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Serviço de autenticação não configurado.');

  const redirectUrl = `${window.location.origin}${window.location.pathname}#type=recovery`;

  const { error } = await client.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: redirectUrl
  });

  if (error) throw new Error('Não foi possível enviar o e-mail de recuperação. Verifique o endereço indicado.');
  return 'Ligação de recuperação enviada. Verifique a sua caixa de correio.';
};

export const handleUpdatePassword = async (newPassword: string, confirmPassword: string): Promise<string> => {
  if (newPassword.length < 6) {
    throw new Error('A palavra-passe deve ter pelo menos 6 caracteres.');
  }
  if (newPassword !== confirmPassword) {
    throw new Error('As palavras-passe não coincidem.');
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Serviço de autenticação não configurado.');

  const { error } = await client.auth.updateUser({
    password: newPassword
  });

  if (error) throw new Error('Não foi possível actualizar a palavra-passe.');

  if (typeof window !== 'undefined' && window.history?.replaceState) {
    window.history.replaceState(null, '', window.location.pathname);
  }

  return 'Palavra-passe actualizada.';
};

export function normalizeContactToEmail(contactOrEmail: string): string {
  if (!contactOrEmail) return '';
  const trimmed = contactOrEmail.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return `${trimmed}@axofacil.mz`;
  return `${digits}@axofacil.mz`;
}

export async function supabaseSignUp(email: string, pass: string, metadata: Record<string, unknown> = {}) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Serviço de autenticação indisponível. Verifique a configuração do Supabase.');
  }

  const canonicalEmail = normalizeContactToEmail(email);
  const rawContact = email.trim();
  const safeRole = sanitizeSignupRole(typeof metadata.role === 'string' ? metadata.role : 'cliente');
  const displayName = String(metadata.name || metadata.full_name || rawContact.split('@')[0]).trim();
  const companyName = String(metadata.storeName || metadata.companyName || '').trim();
  const trialEndsAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

  const userMeta = {
    name: displayName,
    full_name: displayName,
    role: safeRole,
    phone: String(metadata.phone || rawContact),
    raw_contact: rawContact,
    company_name: companyName,
    subscription_plan: 'Gratuito',
    trial_ends_at: trialEndsAt,
    is_phone_account: !rawContact.includes('@')
  };

  const { data, error } = await client.auth.signUp({
    email: canonicalEmail,
    password: pass,
    options: {
      data: userMeta
    }
  });
  if (error) throw error;

  if (data?.user) {
    await syncUserProfileToSupabase({
      id: data.user.id,
      emailOrPhone: rawContact,
      email: canonicalEmail,
      phone: rawContact,
      name: displayName,
      displayName,
      role: safeRole,
      storeName: companyName,
      subscriptionPlan: 'Gratuito',
      isPremium: false
    });
  }

  return data;
}

export async function supabaseSignIn(email: string, pass: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Serviço de autenticação indisponível. Verifique a configuração do Supabase.');
  }

  const canonicalEmail = normalizeContactToEmail(email);
  const rawContact = email.trim();

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: canonicalEmail,
      password: pass
    });
    if (!error && data) return data;
    if (error && canonicalEmail === rawContact) throw error;
  } catch (firstErr) {
    if (rawContact !== canonicalEmail) {
      const { data, error } = await client.auth.signInWithPassword({
        email: rawContact,
        password: pass
      });
      if (error) throw error;
      return data;
    }
    throw firstErr;
  }
}

export async function supabaseSignInWithGoogle() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Serviço de autenticação indisponível.');
  }
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${window.location.pathname}`
    }
  });
  if (error) throw error;
  return data;
}

export async function supabaseSignOut() {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function supabaseResetPassword(email: string) {
  return handleForgotPassword(email);
}

export async function syncUserProfileToSupabase(user: Record<string, any> | object) {
  const client = getSupabaseClient();
  if (!client || !user) return;
  const u = user as Record<string, any>;
  try {
    const rawContact = String(u.emailOrPhone || u.email || u.phone || '').trim();
    const canonicalEmail = normalizeContactToEmail(rawContact);
    const fullName = String(u.name || u.displayName || u.full_name || rawContact.split('@')[0]);
    const storeName = u.storeName || u.clientOrStoreName || u.company_name || null;

    const userIdStr = typeof u.id === 'string' ? u.id : '';
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdStr);

    let targetId: string | null = isUUID ? userIdStr : null;
    if (!targetId) {
      const { data: authUser } = await client.auth.getUser();
      if (authUser?.user?.id) {
        targetId = authUser.user.id;
      }
    }

    if (!targetId) return;

    const payload: Record<string, unknown> = {
      id: targetId,
      full_name: fullName,
      email: canonicalEmail,
      phone: String(u.phone || rawContact),
      company_name: storeName ? String(storeName) : null,
      updated_at: new Date().toISOString()
    };

    await client.from('profiles').upsert(payload, { onConflict: 'id' });
  } catch (err) {
    console.error('Erro ao sincronizar perfil:', err);
  }
}

export async function fetchUserProfileByContactFromSupabase(emailOrPhone: string) {
  const client = getSupabaseClient();
  if (!client || !emailOrPhone) return null;
  try {
    const raw = emailOrPhone.trim().toLowerCase();
    const canonical = normalizeContactToEmail(raw);

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .or(`email.ilike.${raw},email.ilike.${canonical},phone.ilike.${raw}`)
      .maybeSingle();

    if (error || !data) return null;

    const isAdmin = await checkIsAdminInSupabase(data.id);

    return {
      id: data.id,
      name: data.full_name || raw.split('@')[0],
      displayName: data.full_name,
      emailOrPhone: data.phone || raw,
      email: data.email || canonical,
      phone: data.phone || raw,
      city: data.city || undefined,
      role: isAdmin ? 'admin' : (data.role || 'cliente'),
      storeName: data.company_name,
      clientOrStoreName: data.company_name,
      subscriptionPlan: data.subscription_plan || 'Gratuito',
      isPremium: Boolean(data.is_premium),
      isVerified: Boolean(data.is_verified),
      created_at: data.created_at
    };
  } catch {
    return null;
  }
}

export async function deleteEstablishmentFromSupabase(id: string) {
  const client = getSupabaseClient();
  if (!client || !id) return;
  try {
    await client.from('establishments').delete().eq('id', id);
  } catch (err) {
    console.error('Erro ao remover estabelecimento:', err);
  }
}

export async function deleteProductFromSupabase(id: string) {
  const client = getSupabaseClient();
  if (!client || !id) return;
  try {
    await client.from('inventory_items').delete().eq('id', id);
  } catch (err) {
    console.error('Erro ao remover produto:', err);
  }
}

export async function deleteUserProfileFromSupabase(id: string, emailOrPhone?: string) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      await client.from('profiles').delete().eq('id', id);
    } else if (emailOrPhone) {
      const raw = emailOrPhone.trim().toLowerCase();
      const canonical = normalizeContactToEmail(raw);
      await client.from('profiles').delete().or(`email.eq.${raw},email.eq.${canonical},phone.eq.${raw}`);
    }
  } catch (err) {
    console.error('Erro ao remover perfil:', err);
  }
}

export async function syncEstablishmentToSupabase(entity: Record<string, any> | object) {
  const client = getSupabaseClient();
  if (!client) return;
  const est = entity as Record<string, any>;
  try {
    const { data: authData } = await client.auth.getUser();
    await client.from('establishments').upsert({
      id: est.id,
      user_id: est.ownerId || authData?.user?.id || null,
      name: est.name,
      category: est.category,
      zone: est.zone,
      province: est.province || 'Maputo Cidade',
      address: est.address || 'Maputo',
      endereco_texto: est.addressText || est.address,
      latitude: est.latitude ?? null,
      longitude: est.longitude ?? null,
      location_landmarks: est.locationLandmarks ?? null,
      description: est.description || '',
      contact_phone: est.contactPhone || est.phone || '',
      sales_type: est.salesType,
      is_active: est.isActive ?? true,
      updated_at: new Date().toISOString(),
      raw_json: est
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Erro ao sincronizar estabelecimento:', err);
  }
}

export async function syncDeliveryPartnerToSupabase(entity: Record<string, any> | object) {
  const client = getSupabaseClient();
  if (!client) return;
  const partner = entity as Record<string, any>;
  try {
    const { data: authData } = await client.auth.getUser();
    await client.from('delivery_partners').upsert({
      id: partner.id,
      user_id: authData?.user?.id || null,
      name: partner.name,
      vehicle_type: partner.vehicleType,
      plate_number: partner.plateNumber,
      residence_zone: partner.residenceZone,
      phone: partner.phone,
      base_rate: partner.baseRate,
      is_available: partner.isAvailable,
      latitude: partner.latitude ?? null,
      longitude: partner.longitude ?? null,
      updated_at: new Date().toISOString(),
      raw_json: partner
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Erro ao sincronizar entregador:', err);
  }
}

export async function syncOrderToSupabase(entity: Record<string, any> | object) {
  const client = getSupabaseClient();
  if (!client) return;
  const order = entity as Record<string, any>;
  try {
    const { data: authData } = await client.auth.getUser();
    await client.from('orders').upsert({
      id: order.id,
      user_id: authData?.user?.id || null,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      total_amount: order.totalAmount,
      payment_status: 'pendente',
      order_status: 'novo',
      establishment_id: order.establishmentId,
      delivery_address: order.deliveryAddress || 'Maputo',
      created_at: order.createdAt || new Date().toISOString(),
      raw_json: order
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Erro ao sincronizar encomenda:', err);
  }
}

export async function syncPaymentOrderToSupabase(entity: Record<string, any> | object) {
  const client = getSupabaseClient();
  if (!client) return;
  const order = entity as Record<string, any>;
  try {
    const { data: authData } = await client.auth.getUser();
    const subtotalVal = Number(order.subtotalAmountMT ?? order.subtotal ?? 0);
    const deliveryVal = Number(order.deliveryFeeMT ?? order.deliveryFee ?? 0);
    const totalVal = Number(order.totalAmountMT ?? order.totalAmount ?? 0);
    await client.from('payment_orders').upsert({
      id: order.id,
      user_id: authData?.user?.id || null,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_email: order.customerEmail || null,
      target_type: order.targetType === 'loja' ? 'loja' : 'plataforma',
      establishment_id: order.establishmentId || null,
      establishment_name: order.establishmentName,
      order_items_summary: order.orderItemsSummary,
      subtotal: subtotalVal,
      delivery_fee: deliveryVal,
      total_amount: totalVal,
      subtotal_amount_mt: subtotalVal,
      delivery_fee_mt: deliveryVal,
      total_amount_mt: totalVal,
      payment_method: order.paymentMethod,
      reference_number: order.referenceNumber,
      proof_url: order.proofUrl || null,
      status: 'pendente',
      delivery_option: order.deliveryOption || 'pickup',
      delivery_address: order.deliveryAddress || null,
      created_at: order.createdAt || new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Erro ao sincronizar pedido de pagamento:', err);
  }
}

export async function updatePaymentOrderStatusInSupabase(
  orderId: string,
  status: 'confirmado' | 'rejeitado',
  notes?: string
) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const updatePayload: Record<string, unknown> = {
      status,
      admin_notes: notes || null
    };
    if (status === 'confirmado') {
      updatePayload.confirmed_at = new Date().toISOString();
    } else {
      updatePayload.rejection_reason = notes || null;
    }
    await client.from('payment_orders').update(updatePayload).eq('id', orderId);
  } catch (err) {
    console.error('Erro ao actualizar estado do pagamento:', err);
  }
}

export async function syncFinancialTxToSupabase(entity: Record<string, any> | object) {
  const client = getSupabaseClient();
  if (!client) return;
  const tx = entity as Record<string, any>;
  try {
    const { data: authData } = await client.auth.getUser();
    await client.from('financial_transactions').upsert({
      id: tx.id,
      user_id: authData?.user?.id || null,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      raw_json: tx
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Erro ao sincronizar transacção:', err);
  }
}

export async function syncInventoryItemToSupabase(entity: Record<string, any> | object) {
  const client = getSupabaseClient();
  if (!client) return;
  const item = entity as Record<string, any>;
  try {
    await client.from('inventory_items').upsert({
      id: item.id,
      establishment_id: item.establishmentId || null,
      name: item.name,
      category: item.category || 'geral',
      stock_quantity: Number(item.quantity ?? item.stockQuantity ?? 0),
      price: Number(item.price ?? 0),
      updated_at: new Date().toISOString(),
      raw_json: item
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Erro ao sincronizar item de inventário:', err);
  }
}

export async function syncPlatformSettingsToSupabase(settings: {
  paymentAccounts: unknown;
  businessPlans: unknown;
  clientPlans: unknown;
}) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('platform_settings').upsert({
      id: 'default',
      payment_accounts: settings.paymentAccounts,
      business_plans: settings.businessPlans,
      client_plans: settings.clientPlans,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Erro ao sincronizar definições da plataforma:', err);
  }
}

export async function fetchPlatformSettingsFromSupabase() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('platform_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();
    if (error || !data) return null;
    return {
      paymentAccounts: data.payment_accounts,
      businessPlans: data.business_plans,
      clientPlans: data.client_plans
    };
  } catch {
    return null;
  }
}

export async function fetchEstablishmentsFromSupabase() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('establishments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

export async function fetchOrdersFromSupabase(userId?: string) {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    let query = client.from('orders').select('*').order('created_at', { ascending: false });
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

export async function fetchUserProfileFromSupabase(userId: string) {
  const client = getSupabaseClient();
  if (!client || !userId) return null;
  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return null;
    const isAdmin = await checkIsAdminInSupabase(userId);
    return {
      ...data,
      role: isAdmin ? 'admin' : data.role
    };
  } catch {
    return null;
  }
}

/**
 * Faz o carregamento de um ficheiro (imagem ou PDF) exclusivamente para o Supabase Storage.
 * Exige o primeiro segmento do caminho igual ao UID do utilizador autenticado para cumprir a política RLS.
 */
export async function uploadFileToStorage(file: File, bucket: string = 'uploads'): Promise<string> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('O ficheiro excede o limite de 10 MB.');
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data: sessionData } = await client.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      const accessToken = sessionData?.session?.access_token;

      if (userId) {
        const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5) || 'jpg';
        const targetBucket = ['images', 'avatars', 'documents', 'uploads'].includes(bucket) ? bucket : 'uploads';
        const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;

        const { data, error } = await client.storage
          .from(targetBucket)
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (!error && data) {
          const { data: urlData } = client.storage.from(targetBucket).getPublicUrl(filePath);
          const publicUrl = urlData?.publicUrl || '';
          if (publicUrl) {
            await client.from('media').insert({
              user_id: userId,
              file_name: file.name.slice(0, 120),
              file_size: file.size,
              mime_type: file.type,
              public_url: publicUrl,
              supabase_url: publicUrl,
              folder: targetBucket
            });
            return publicUrl;
          }
        }
      }

      if (accessToken) {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result || ''));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || 'image/jpeg',
            base64Data,
            bucket: ['images', 'avatars', 'documents', 'uploads'].includes(bucket) ? bucket : 'uploads'
          })
        });

        if (res.ok) {
          const body = await res.json();
          if (body?.url) return body.url;
        }
      }
    } catch (err) {
      console.error('Erro no upload para o Supabase Storage:', err);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Não foi possível ler o ficheiro.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadImageToSupabaseStorage(file: File): Promise<string | null> {
  try {
    return await uploadFileToStorage(file, 'images');
  } catch {
    return null;
  }
}
