# Axofácil — Directório e Marketplace de Maputo e Matola

Plataforma web para descoberta de estabelecimentos comerciais, encomendas, gestão de inventário, caixa POS offline-first e logística de entregas na Grande Maputo (Maputo e Matola, Moçambique).

## Stack Técnica

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7, Leaflet (OpenStreetMap)
- **Backend:** Express (Node.js / Vercel Serverless) com Helmet, CORS e Rate Limiting
- **Base de Dados, Autenticação e Storage:** Supabase (PostgreSQL com RLS, GoTrue Auth, Supabase Storage)

## Variáveis de Ambiente

Copie `.env.example` para `.env`:

```env
# Públicas (bundle do cliente)
VITE_SUPABASE_URL=https://o-seu-projecto.supabase.co
VITE_SUPABASE_ANON_KEY=a-sua-chave-anon-publica

# Exclusivas do servidor (nunca expostas no cliente)
SUPABASE_URL=https://o-seu-projecto.supabase.co
SUPABASE_ANON_KEY=a-sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=a-sua-service-role-key
ALLOWED_ORIGIN=https://axofacil.co.mz
```

## Base de Dados e Primeiro Administrador

1. Execute o conteúdo de `supabase_schema.sql` no SQL Editor do Supabase.
2. Crie a conta do administrador através do registo normal da aplicação ou no painel Authentication do Supabase.
3. Promova o utilizador a administrador inserindo o seu UUID na tabela `public.admin_users` através do SQL Editor:

```sql
INSERT INTO public.admin_users (user_id)
VALUES ('UUID-DO-UTILIZADOR-NO-AUTH-USERS')
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.profiles
SET role = 'admin', is_verified = true
WHERE id = 'UUID-DO-UTILIZADOR-NO-AUTH-USERS';
```

## Comandos

- `npm run dev` — Inicia o servidor Express + Vite em `http://localhost:3000`
- `npm run lint` — Verifica tipos TypeScript (`tsc --noEmit`)
- `npm run build` — Compila o cliente e o servidor para produção (`dist/`)
- `npm start` — Inicia o servidor compilado
