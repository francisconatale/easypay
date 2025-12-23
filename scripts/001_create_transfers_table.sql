-- Crear tabla de transferencias de Mercado Pago
create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  mp_transaction_id text unique not null,
  amount decimal(10, 2) not null,
  description text,
  payer_name text,
  payer_email text,
  status text not null default 'pending',
  payment_method text,
  transaction_date timestamptz not null default now(),
  invoiced boolean not null default false,
  invoice_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para mejorar performance
create index if not exists idx_transfers_transaction_date on public.transfers(transaction_date desc);
create index if not exists idx_transfers_status on public.transfers(status);
create index if not exists idx_transfers_invoiced on public.transfers(invoiced);
create index if not exists idx_transfers_mp_transaction_id on public.transfers(mp_transaction_id);

-- Función para actualizar updated_at automáticamente
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger para updated_at
create trigger update_transfers_updated_at
  before update on public.transfers
  for each row
  execute function update_updated_at_column();

-- Datos de ejemplo para testing
insert into public.transfers (mp_transaction_id, amount, description, payer_name, payer_email, status, payment_method, transaction_date) values
  ('MP001234567', 15000.00, 'Servicio de consultoría - Enero 2024', 'Juan Pérez', 'juan.perez@email.com', 'approved', 'credit_card', '2024-01-15 10:30:00'),
  ('MP001234568', 25000.50, 'Desarrollo web - Proyecto ABC', 'María García', 'maria.garcia@email.com', 'approved', 'debit_card', '2024-01-18 14:45:00'),
  ('MP001234569', 8500.00, 'Diseño gráfico - Logo empresa', 'Carlos López', 'carlos.lopez@email.com', 'approved', 'bank_transfer', '2024-01-20 09:15:00'),
  ('MP001234570', 32000.00, 'Mantenimiento mensual - Febrero', 'Ana Martínez', 'ana.martinez@email.com', 'approved', 'credit_card', '2024-02-01 11:00:00'),
  ('MP001234571', 12000.00, 'Asesoría técnica', 'Roberto Silva', 'roberto.silva@email.com', 'approved', 'mercadopago', '2024-02-05 16:20:00'),
  ('MP001234572', 45000.00, 'Proyecto desarrollo móvil', 'Laura Fernández', 'laura.fernandez@email.com', 'approved', 'credit_card', '2024-02-10 13:30:00'),
  ('MP001234573', 18500.00, 'Consultoría SEO - Marzo', 'Diego Rodríguez', 'diego.rodriguez@email.com', 'approved', 'debit_card', '2024-03-01 10:00:00'),
  ('MP001234574', 22000.00, 'Mantenimiento servidor', 'Patricia Gómez', 'patricia.gomez@email.com', 'pending', 'bank_transfer', '2024-03-05 15:45:00');
