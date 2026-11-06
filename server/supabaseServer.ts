import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

let serverClientInstance: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  const apiKey = serviceRoleKey || anonKey;

  if (!supabaseUrl || !apiKey || supabaseUrl === 'https://your-supabase-project.supabase.co') {
    return null;
  }

  if (!serverClientInstance) {
    serverClientInstance = createClient(supabaseUrl, apiKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return serverClientInstance;
}

export async function verifyBearerToken(authHeader?: string): Promise<User | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const client = getSupabaseServerClient();
  if (!client) return null;

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    return null;
  }
  return data.user;
}

export async function isServerUserAdmin(userId: string): Promise<boolean> {
  const client = getSupabaseServerClient();
  if (!client || !userId) return false;

  const { data } = await client
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  return Boolean(data?.user_id);
}

export async function canUserManageEstablishment(userId: string, establishmentId: string): Promise<boolean> {
  const client = getSupabaseServerClient();
  if (!client || !userId || !establishmentId) return false;

  if (await isServerUserAdmin(userId)) {
    return true;
  }

  const { data } = await client
    .from('establishments')
    .select('id, user_id')
    .eq('id', establishmentId)
    .maybeSingle();

  return Boolean(data && data.user_id === userId);
}
