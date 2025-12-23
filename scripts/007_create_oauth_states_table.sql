-- Crear tabla para estados de OAuth (para vincular usuarios sin cookies)
create table if not exists public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  state text unique not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Índices
create index if not exists idx_oauth_states_state on public.oauth_states(state);
