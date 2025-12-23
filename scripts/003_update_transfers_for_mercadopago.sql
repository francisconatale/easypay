-- Actualizar tabla de transfers para reflejar estructura real de Mercado Pago
alter table public.transfers 
  add column if not exists net_amount decimal(10, 2),
  add column if not exists fee_amount decimal(10, 2),
  add column if not exists payer_dni text,
  add column if not exists installments integer default 1,
  add column if not exists card_last_four text,
  add column if not exists external_reference text,
  add column if not exists items jsonb;

-- Actualizar datos existentes con información más realista
update public.transfers set
  net_amount = amount * 0.95,
  fee_amount = amount * 0.05,
  installments = 1
where net_amount is null;

comment on column public.transfers.net_amount is 'Monto neto recibido después de comisiones';
comment on column public.transfers.fee_amount is 'Comisión de Mercado Pago';
comment on column public.transfers.payer_dni is 'DNI del pagador';
comment on column public.transfers.installments is 'Cantidad de cuotas';
comment on column public.transfers.card_last_four is 'Últimos 4 dígitos de la tarjeta';
comment on column public.transfers.external_reference is 'Referencia externa del pago';
comment on column public.transfers.items is 'Items vendidos en formato JSON';
