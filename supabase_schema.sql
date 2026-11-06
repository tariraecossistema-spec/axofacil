-- Axofácil — Esquema de Base de Dados e Políticas RLS (Idempotente)
-- Maputo e Matola, Moçambique

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Administradores geridos exclusivamente por service_role
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_self_read" ON public.admin_users;
CREATE POLICY "admin_users_self_read" ON public.admin_users
    FOR SELECT USING (auth.uid() = user_id);

-- Função de verificação de administrador (sem e-mails fixos nem leitura de user_metadata)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        EXISTS (
            SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
        )
        OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Perfis de utilizador
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN (
        'cliente',
        'loja',
        'supermercado',
        'bar',
        'hospedagem',
        'construcao',
        'pecas_auto',
        'turismo',
        'entregador',
        'admin'
    )),
    phone TEXT,
    city TEXT DEFAULT 'Maputo',
    address TEXT,
    avatar_url TEXT,
    company_name TEXT,
    nif_number TEXT,
    subscription_plan TEXT DEFAULT 'Gratuito',
    is_premium BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 days'),
    subscription_valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'cliente';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Maputo';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nif_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'Gratuito';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 days');
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_valid_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Actualizar constraint de role em tabelas existentes para incluir 'turismo'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN (
    'cliente',
    'loja',
    'supermercado',
    'bar',
    'hospedagem',
    'construcao',
    'pecas_auto',
    'turismo',
    'entregador',
    'admin'
));

-- Vista pública apenas com dados não sensíveis para o directório
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
    id,
    full_name,
    avatar_url,
    city,
    company_name,
    role,
    is_verified,
    created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Impedir que utilizadores não administradores alterem colunas sensíveis do próprio perfil
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_admin() AND current_setting('role', true) <> 'service_role' THEN
        NEW.role := OLD.role;
        NEW.is_premium := OLD.is_premium;
        NEW.subscription_plan := OLD.subscription_plan;
        NEW.is_verified := OLD.is_verified;
        NEW.trial_ends_at := OLD.trial_ends_at;
        NEW.subscription_valid_until := OLD.subscription_valid_until;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_sensitive_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_sensitive_columns
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_sensitive_columns();

-- Trigger de registo seguro (apenas papéis não privilegiados e trial de 15 dias)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    requested_role TEXT;
    safe_role TEXT;
    user_name TEXT;
    user_phone TEXT;
    user_city TEXT;
BEGIN
    requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'cliente');

    IF requested_role IN ('cliente', 'loja', 'supermercado', 'bar', 'hospedagem', 'construcao', 'pecas_auto', 'turismo', 'entregador') THEN
        safe_role := requested_role;
    ELSE
        safe_role := 'cliente';
    END IF;

    user_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    user_phone := NEW.raw_user_meta_data->>'phone';
    user_city := COALESCE(NEW.raw_user_meta_data->>'city', 'Maputo');

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        phone,
        city,
        subscription_plan,
        is_premium,
        trial_ends_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        user_name,
        safe_role,
        user_phone,
        user_city,
        'Gratuito',
        FALSE,
        NOW() + INTERVAL '15 days'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Estabelecimentos comerciais e serviços
CREATE TABLE IF NOT EXISTS public.establishments (
    id TEXT PRIMARY KEY DEFAULT ('est_' || replace(gen_random_uuid()::text, '-', '')),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    zone TEXT,
    subcategories TEXT[] DEFAULT '{}',
    description TEXT DEFAULT '',
    address TEXT NOT NULL DEFAULT 'Maputo, Moçambique',
    endereco_texto TEXT,
    city TEXT NOT NULL DEFAULT 'Maputo',
    province TEXT NOT NULL DEFAULT 'Cidade de Maputo',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_landmarks TEXT,
    phone TEXT NOT NULL DEFAULT '',
    contact_phone TEXT,
    whatsapp TEXT,
    email TEXT,
    website TEXT,
    opening_hours TEXT DEFAULT 'Seg - Sáb: 08:00 - 18:00',
    sales_type TEXT,
    images TEXT[] DEFAULT '{}',
    logo_url TEXT,
    banner_url TEXT,
    rating NUMERIC(3, 2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_open BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    delivery_available BOOLEAN DEFAULT FALSE,
    delivery_fee NUMERIC(10, 2) DEFAULT 0.00,
    min_order_amount NUMERIC(10, 2) DEFAULT 0.00,
    subscription_tier TEXT DEFAULT 'Gratuito',
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    raw_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS zone TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS subcategories TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT 'Maputo, Moçambique';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS endereco_texto TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'Maputo';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS province TEXT NOT NULL DEFAULT 'Cidade de Maputo';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS location_landmarks TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS opening_hours TEXT DEFAULT 'Seg - Sáb: 08:00 - 18:00';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS sales_type TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS raw_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Estafetas / Entregadores
CREATE TABLE IF NOT EXISTS public.delivery_partners (
    id TEXT PRIMARY KEY DEFAULT ('dlv_' || replace(gen_random_uuid()::text, '-', '')),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    vehicle_type TEXT NOT NULL DEFAULT 'moto',
    license_plate TEXT,
    plate_number TEXT,
    city TEXT NOT NULL DEFAULT 'Maputo',
    current_zone TEXT DEFAULT 'Baixa de Maputo',
    residence_zone TEXT,
    base_rate NUMERIC(10, 2) DEFAULT 150.00,
    current_latitude DOUBLE PRECISION,
    current_longitude DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_online BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'ativo',
    rating NUMERIC(3, 2) DEFAULT 0.00,
    trips_completed INTEGER DEFAULT 0,
    wallet_balance NUMERIC(10, 2) DEFAULT 0.00,
    raw_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.delivery_partners ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.delivery_partners ADD COLUMN IF NOT EXISTS plate_number TEXT;
ALTER TABLE public.delivery_partners ADD COLUMN IF NOT EXISTS residence_zone TEXT;
ALTER TABLE public.delivery_partners ADD COLUMN IF NOT EXISTS base_rate NUMERIC(10, 2) DEFAULT 150.00;
ALTER TABLE public.delivery_partners ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.delivery_partners ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.delivery_partners ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.delivery_partners ADD COLUMN IF NOT EXISTS raw_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.delivery_partners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Produtos e itens de inventário
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id TEXT PRIMARY KEY DEFAULT ('prod_' || replace(gen_random_uuid()::text, '-', '')),
    establishment_id TEXT REFERENCES public.establishments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'geral',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_price NUMERIC(10, 2),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'unidade',
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    raw_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS establishment_id TEXT REFERENCES public.establishments(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'geral';
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS discount_price NUMERIC(10, 2);
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'unidade';
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS raw_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 6. Encomendas
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT ('ord_' || replace(gen_random_uuid()::text, '-', '')),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    establishment_id TEXT REFERENCES public.establishments(id) ON DELETE SET NULL,
    delivery_partner_id TEXT REFERENCES public.delivery_partners(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'mpesa',
    payment_status TEXT NOT NULL DEFAULT 'pendente',
    order_status TEXT NOT NULL DEFAULT 'novo',
    delivery_address TEXT NOT NULL DEFAULT 'Maputo, Moçambique',
    raw_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS establishment_id TEXT REFERENCES public.establishments(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_partner_id TEXT REFERENCES public.delivery_partners(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'mpesa';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pendente';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status TEXT NOT NULL DEFAULT 'novo';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT NOT NULL DEFAULT 'Maputo, Moçambique';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS raw_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7. Pedidos de pagamento (Checkout / Subscrições)
CREATE TABLE IF NOT EXISTS public.payment_orders (
    id TEXT PRIMARY KEY DEFAULT ('pag_' || replace(gen_random_uuid()::text, '-', '')),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL DEFAULT '',
    customer_phone TEXT NOT NULL DEFAULT '',
    customer_email TEXT,
    target_type TEXT NOT NULL DEFAULT 'loja' CHECK (target_type IN ('plataforma', 'loja')),
    establishment_id TEXT,
    establishment_name TEXT NOT NULL DEFAULT '',
    order_items_summary TEXT NOT NULL DEFAULT '',
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    subtotal_amount_mt NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee_mt NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount_mt NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'mpesa',
    reference_number TEXT NOT NULL DEFAULT '',
    proof_url TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'rejeitado')),
    delivery_option TEXT DEFAULT 'pickup',
    delivery_address TEXT,
    rejection_reason TEXT,
    admin_notes TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migração idempotente caso a tabela payment_orders já exista com o esquema anterior (ex: total_amount sem total_amount_mt)
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS customer_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'loja';
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS establishment_id TEXT;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS establishment_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS order_items_summary TEXT NOT NULL DEFAULT '';
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS subtotal_amount_mt NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS delivery_fee_mt NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS total_amount_mt NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'mpesa';
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS reference_number TEXT NOT NULL DEFAULT '';
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente';
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS delivery_option TEXT DEFAULT 'pickup';
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Sincronizar valores existentes entre total_amount e total_amount_mt se existirem registos anteriores
UPDATE public.payment_orders
SET total_amount_mt = COALESCE(total_amount, 0)
WHERE total_amount_mt = 0 AND COALESCE(total_amount, 0) > 0;

-- 8. Vendas e Turnos do POS
CREATE TABLE IF NOT EXISTS public.pos_sales (
    id TEXT PRIMARY KEY,
    establishment_id TEXT NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    shift_id TEXT,
    operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'numerario',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    server_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pos_sales ADD COLUMN IF NOT EXISTS establishment_id TEXT REFERENCES public.establishments(id) ON DELETE CASCADE;
ALTER TABLE public.pos_sales ADD COLUMN IF NOT EXISTS shift_id TEXT;
ALTER TABLE public.pos_sales ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.pos_sales ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.pos_sales ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'numerario';
ALTER TABLE public.pos_sales ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.pos_sales ADD COLUMN IF NOT EXISTS server_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.pos_sales ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.pos_shifts (
    id TEXT PRIMARY KEY,
    establishment_id TEXT NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'aberto',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pos_shifts ADD COLUMN IF NOT EXISTS establishment_id TEXT REFERENCES public.establishments(id) ON DELETE CASCADE;
ALTER TABLE public.pos_shifts ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.pos_shifts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'aberto';
ALTER TABLE public.pos_shifts ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.pos_shifts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.pos_shifts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 9. Transacções financeiras
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id TEXT PRIMARY KEY DEFAULT ('tx_' || replace(gen_random_uuid()::text, '-', '')),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    establishment_id TEXT REFERENCES public.establishments(id) ON DELETE SET NULL,
    order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    description TEXT NOT NULL DEFAULT '',
    payment_gateway TEXT DEFAULT 'multicaixa',
    reference_code TEXT,
    status TEXT NOT NULL DEFAULT 'concluido',
    raw_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS establishment_id TEXT REFERENCES public.establishments(id) ON DELETE SET NULL;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'receita';
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'multicaixa';
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS reference_code TEXT;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'concluido';
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS raw_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 10. Promoções
CREATE TABLE IF NOT EXISTS public.promo_deals (
    id TEXT PRIMARY KEY DEFAULT ('prm_' || replace(gen_random_uuid()::text, '-', '')),
    establishment_id TEXT REFERENCES public.establishments(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    discount_percentage INTEGER,
    old_price NUMERIC(10, 2),
    new_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    image_url TEXT,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.promo_deals ADD COLUMN IF NOT EXISTS establishment_id TEXT REFERENCES public.establishments(id) ON DELETE CASCADE;
ALTER TABLE public.promo_deals ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.promo_deals ADD COLUMN IF NOT EXISTS discount_percentage INTEGER;
ALTER TABLE public.promo_deals ADD COLUMN IF NOT EXISTS old_price NUMERIC(10, 2);
ALTER TABLE public.promo_deals ADD COLUMN IF NOT EXISTS new_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.promo_deals ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.promo_deals ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.promo_deals ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.promo_deals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 11. Submissões administrativas
CREATE TABLE IF NOT EXISTS public.admin_submissions (
    id TEXT PRIMARY KEY DEFAULT ('sub_' || replace(gen_random_uuid()::text, '-', '')),
    type TEXT NOT NULL,
    applicant_name TEXT NOT NULL DEFAULT '',
    applicant_contact TEXT NOT NULL DEFAULT '',
    applicant_email TEXT,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pendente',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_submissions ADD COLUMN IF NOT EXISTS applicant_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.admin_submissions ADD COLUMN IF NOT EXISTS applicant_contact TEXT NOT NULL DEFAULT '';
ALTER TABLE public.admin_submissions ADD COLUMN IF NOT EXISTS applicant_email TEXT;
ALTER TABLE public.admin_submissions ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.admin_submissions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente';
ALTER TABLE public.admin_submissions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.admin_submissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.admin_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 12. Media e ficheiros carregados
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL DEFAULT '',
    file_size INTEGER DEFAULT 0,
    mime_type TEXT DEFAULT 'image/jpeg',
    public_url TEXT NOT NULL DEFAULT '',
    supabase_url TEXT,
    folder TEXT DEFAULT 'uploads',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.media ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS file_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT 'image/jpeg';
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS public_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS supabase_url TEXT;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS folder TEXT DEFAULT 'uploads';
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 13. Definições da plataforma (sem números de pagamento falsos por defeito)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    payment_accounts JSONB NOT NULL DEFAULT '{}'::jsonb,
    business_plans JSONB NOT NULL DEFAULT '{}'::jsonb,
    client_plans JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS payment_accounts JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS business_plans JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS client_plans JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- DEFINIR: Configurar números reais de M-Pesa, e-Mola e NIB no painel de administração (platform_settings).
INSERT INTO public.platform_settings (id, payment_accounts, business_plans, client_plans)
VALUES (
    'default',
    '{
        "mpesa": { "titular": "", "numero": "" },
        "emola": { "titular": "", "numero": "" },
        "banco": { "titular": "", "numero": "", "banco": "" }
    }'::jsonb,
    '{
        "bronze": { "name": "Plano Base — Estabelecimento no Directório", "priceMT": 600 },
        "prata": { "name": "Plano Pro Destaque — Prioridade na Pesquisa", "priceMT": 1000 },
        "ouro": { "name": "Plano Empresarial + Entregas", "priceMT": 1500 }
    }'::jsonb,
    '{
        "mensal": { "name": "Acesso Cliente — Mensal", "priceMT": 150 },
        "semestral": { "name": "Acesso Cliente — Semestral (6 Meses)", "priceMT": 500 },
        "anual": { "name": "Acesso Cliente — Anual (12 Meses)", "priceMT": 1200 }
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: apenas o titular ou administrador acedem à tabela base (visitantes usam public_profiles)
DROP POLICY IF EXISTS "public_read_profiles" ON public.profiles;
DROP POLICY IF EXISTS "manage_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_own_or_admin" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_delete_admin" ON public.profiles
    FOR DELETE USING (public.is_admin());

-- Establishments: leitura pública; escrita apenas pelo proprietário ou admin
DROP POLICY IF EXISTS "public_read_establishments" ON public.establishments;
DROP POLICY IF EXISTS "manage_establishments" ON public.establishments;
DROP POLICY IF EXISTS "establishments_insert_owner" ON public.establishments;
DROP POLICY IF EXISTS "establishments_update_owner" ON public.establishments;
DROP POLICY IF EXISTS "establishments_delete_owner" ON public.establishments;

CREATE POLICY "public_read_establishments" ON public.establishments
    FOR SELECT USING (true);

CREATE POLICY "establishments_insert_owner" ON public.establishments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR public.is_admin()));

CREATE POLICY "establishments_update_owner" ON public.establishments
    FOR UPDATE USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "establishments_delete_owner" ON public.establishments
    FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- Delivery Partners: leitura pública; gestão pelo próprio estafeta ou admin
DROP POLICY IF EXISTS "public_read_couriers" ON public.delivery_partners;
DROP POLICY IF EXISTS "manage_couriers" ON public.delivery_partners;
DROP POLICY IF EXISTS "couriers_insert_owner" ON public.delivery_partners;
DROP POLICY IF EXISTS "couriers_update_owner" ON public.delivery_partners;
DROP POLICY IF EXISTS "couriers_delete_admin" ON public.delivery_partners;

CREATE POLICY "public_read_couriers" ON public.delivery_partners
    FOR SELECT USING (true);

CREATE POLICY "couriers_insert_owner" ON public.delivery_partners
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR public.is_admin()));

CREATE POLICY "couriers_update_owner" ON public.delivery_partners
    FOR UPDATE USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "couriers_delete_admin" ON public.delivery_partners
    FOR DELETE USING (public.is_admin());

-- Inventory Items: leitura pública; gestão apenas pelo dono do estabelecimento ou admin
DROP POLICY IF EXISTS "public_read_inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "manage_inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_write_owner" ON public.inventory_items;

CREATE POLICY "public_read_inventory" ON public.inventory_items
    FOR SELECT USING (true);

CREATE POLICY "inventory_write_owner" ON public.inventory_items
    FOR ALL USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.establishments e
            WHERE e.id = inventory_items.establishment_id AND e.user_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.establishments e
            WHERE e.id = inventory_items.establishment_id AND e.user_id = auth.uid()
        )
    );

-- Orders: inserção validada com estado 'pendente'/'novo'; leitura restrita às partes envolvidas ou admin
DROP POLICY IF EXISTS "public_read_orders" ON public.orders;
DROP POLICY IF EXISTS "manage_orders" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;

CREATE POLICY "orders_insert_policy" ON public.orders
    FOR INSERT WITH CHECK (
        payment_status = 'pendente'
        AND order_status = 'novo'
        AND total_amount >= 0
        AND subtotal >= 0
        AND length(trim(customer_name)) >= 2
        AND length(trim(customer_phone)) >= 8
    );

CREATE POLICY "orders_select_policy" ON public.orders
    FOR SELECT USING (
        public.is_admin()
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.establishments e
            WHERE e.id = orders.establishment_id AND e.user_id = auth.uid()
        )
    );

CREATE POLICY "orders_update_policy" ON public.orders
    FOR UPDATE USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.establishments e
            WHERE e.id = orders.establishment_id AND e.user_id = auth.uid()
        )
    );

CREATE POLICY "orders_delete_admin" ON public.orders
    FOR DELETE USING (public.is_admin());

-- Payment Orders: cliente só pode criar com estado 'pendente'; apenas admin altera ou elimina
DROP POLICY IF EXISTS "payment_orders_insert" ON public.payment_orders;
DROP POLICY IF EXISTS "payment_orders_select" ON public.payment_orders;
DROP POLICY IF EXISTS "payment_orders_admin_update" ON public.payment_orders;
DROP POLICY IF EXISTS "payment_orders_admin_delete" ON public.payment_orders;

CREATE POLICY "payment_orders_insert" ON public.payment_orders
    FOR INSERT WITH CHECK (
        status = 'pendente'
        AND confirmed_at IS NULL
        AND COALESCE(total_amount_mt, total_amount, 0) >= 0
        AND length(trim(customer_name)) >= 2
        AND length(trim(customer_phone)) >= 8
        AND length(trim(reference_number)) >= 3
    );

CREATE POLICY "payment_orders_select" ON public.payment_orders
    FOR SELECT USING (
        public.is_admin()
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.establishments e
            WHERE e.id = payment_orders.establishment_id AND e.user_id = auth.uid()
        )
    );

CREATE POLICY "payment_orders_admin_update" ON public.payment_orders
    FOR UPDATE USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "payment_orders_admin_delete" ON public.payment_orders
    FOR DELETE USING (public.is_admin());

-- POS Sales & Shifts: apenas dono do estabelecimento ou admin
DROP POLICY IF EXISTS "pos_sales_owner_or_admin" ON public.pos_sales;
CREATE POLICY "pos_sales_owner_or_admin" ON public.pos_sales
    FOR ALL USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.establishments e
            WHERE e.id = pos_sales.establishment_id AND e.user_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.establishments e
            WHERE e.id = pos_sales.establishment_id AND e.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "pos_shifts_owner_or_admin" ON public.pos_shifts;
CREATE POLICY "pos_shifts_owner_or_admin" ON public.pos_shifts
    FOR ALL USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.establishments e
            WHERE e.id = pos_shifts.establishment_id AND e.user_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.establishments e
            WHERE e.id = pos_shifts.establishment_id AND e.user_id = auth.uid()
        )
    );

-- Financial Transactions: apenas titular do estabelecimento ou admin
DROP POLICY IF EXISTS "financial_tx_owner_or_admin" ON public.financial_transactions;
CREATE POLICY "financial_tx_owner_or_admin" ON public.financial_transactions
    FOR ALL USING (
        public.is_admin()
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.establishments e
            WHERE e.id = financial_transactions.establishment_id AND e.user_id = auth.uid()
        )
    );

-- Promo Deals: leitura pública; escrita pelo dono do estabelecimento ou admin
DROP POLICY IF EXISTS "public_read_deals" ON public.promo_deals;
DROP POLICY IF EXISTS "manage_deals" ON public.promo_deals;

CREATE POLICY "public_read_deals" ON public.promo_deals
    FOR SELECT USING (true);

CREATE POLICY "manage_deals" ON public.promo_deals
    FOR ALL USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.establishments e
            WHERE e.id = promo_deals.establishment_id AND e.user_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.establishments e
            WHERE e.id = promo_deals.establishment_id AND e.user_id = auth.uid()
        )
    );

-- Admin Submissions: inserção pública validada ('pendente'); leitura e edição apenas por admin
DROP POLICY IF EXISTS "public_read_submissions" ON public.admin_submissions;
DROP POLICY IF EXISTS "manage_submissions" ON public.admin_submissions;
DROP POLICY IF EXISTS "submissions_insert_policy" ON public.admin_submissions;

CREATE POLICY "submissions_insert_policy" ON public.admin_submissions
    FOR INSERT WITH CHECK (
        status = 'pendente'
        AND length(trim(applicant_name)) >= 2
        AND length(trim(applicant_contact)) >= 5
    );

CREATE POLICY "manage_submissions" ON public.admin_submissions
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Media: leitura pública; inserção autenticada; edição/remoção apenas pelo dono ou admin
DROP POLICY IF EXISTS "public_read_media" ON public.media;
DROP POLICY IF EXISTS "manage_media" ON public.media;
DROP POLICY IF EXISTS "media_insert_policy" ON public.media;
DROP POLICY IF EXISTS "media_manage_policy" ON public.media;

CREATE POLICY "public_read_media" ON public.media
    FOR SELECT USING (true);

CREATE POLICY "media_insert_policy" ON public.media
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR public.is_admin()));

CREATE POLICY "media_manage_policy" ON public.media
    FOR ALL USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Platform Settings: leitura pública; escrita apenas por admin
DROP POLICY IF EXISTS "public_read_platform_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "manage_platform_settings" ON public.platform_settings;

CREATE POLICY "public_read_platform_settings" ON public.platform_settings
    FOR SELECT USING (true);

CREATE POLICY "manage_platform_settings" ON public.platform_settings
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- CONFIGURAÇÃO DE BUCKETS DO SUPABASE STORAGE
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('images', 'images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('documents', 'documents', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
    ('uploads', 'uploads', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public Storage Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Delete" ON storage.objects;

CREATE POLICY "Public Storage Access" ON storage.objects
    FOR SELECT USING (bucket_id IN ('images', 'avatars', 'documents', 'uploads'));

CREATE POLICY "Public Storage Insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id IN ('images', 'avatars', 'documents', 'uploads')
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Public Storage Update" ON storage.objects
    FOR UPDATE USING (
        bucket_id IN ('images', 'avatars', 'documents', 'uploads')
        AND (auth.uid() = owner OR public.is_admin())
    );

CREATE POLICY "Public Storage Delete" ON storage.objects
    FOR DELETE USING (
        bucket_id IN ('images', 'avatars', 'documents', 'uploads')
        AND (auth.uid() = owner OR public.is_admin())
    );
