-- Crear tabla para credenciales de Mercado Pago
create table if not exists public.mp_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  mp_user_id bigint not null,
  access_token text not null,
  refresh_token text not null,
  public_key text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Índices
create index if not exists idx_mp_credentials_user_id on public.mp_credentials(user_id);

-- Trigger para updated_at
create trigger update_mp_credentials_updated_at
  before update on public.mp_credentials
  for each row
  execute function update_updated_at_column();
