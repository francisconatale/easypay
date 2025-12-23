-- Agregar columna client_id a la tabla sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Agregar índice para client_id
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id);

-- Agregar columna description a transfers para el motivo editable
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS notes TEXT;

-- Actualizar transfers existentes con descripciones de ejemplo
UPDATE transfers 
SET description = CASE 
  WHEN payment_method = 'account_money' THEN 'Pago recibido - Saldo en cuenta'
  WHEN payment_method = 'credit_card' THEN 'Pago con tarjeta de crédito'
  WHEN payment_method = 'debit_card' THEN 'Pago con tarjeta de débito'
  ELSE 'Pago recibido'
END
WHERE description IS NULL;
