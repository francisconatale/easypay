-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  dni VARCHAR(20),
  cuit VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actualizar tabla de ventas para referenciar clientes
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Actualizar tabla de transfers para poder editar el concepto
ALTER TABLE transfers
  ADD COLUMN IF NOT EXISTS concept TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Insertar clientes de ejemplo
INSERT INTO clients (name, email, phone, dni, cuit) VALUES
('Juan Pérez', 'juan@example.com', '+54 11 2345-6789', '12345678', '20-12345678-9'),
('María González', 'maria@example.com', '+54 11 3456-7890', '23456789', '27-23456789-0'),
('Carlos López', 'carlos@example.com', '+54 11 4567-8901', '34567890', '20-34567890-1'),
('Ana Martínez', 'ana@example.com', '+54 11 5678-9012', '45678901', '27-45678901-2'),
('Pedro Rodríguez', 'pedro@example.com', '+54 11 6789-0123', '56789012', '20-56789012-3'),
('Laura Fernández', 'laura@example.com', '+54 11 7890-1234', '67890123', '27-67890123-4'),
('Diego Silva', 'diego@example.com', '+54 11 8901-2345', '78901234', '20-78901234-5'),
('Sofía Morales', 'sofia@example.com', '+54 11 9012-3456', '89012345', '27-89012345-6');

-- Índices
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_transfers_concept ON transfers(concept);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en clients
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE clients IS 'Tabla de clientes del negocio';
COMMENT ON COLUMN transfers.concept IS 'Concepto/motivo del pago que puede ser editado';
