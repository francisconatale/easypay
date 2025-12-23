-- Tabla de ventas/productos
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID REFERENCES transfers(id) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(50),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  category VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos de ejemplo
INSERT INTO sales (client_name, client_email, client_phone, description, quantity, unit_price, total_amount, sale_date, category) VALUES
('Juan Pérez', 'juan@example.com', '+54 11 2345-6789', 'Desarrollo web completo', 1, 150000.00, 150000.00, '2024-01-15 10:30:00', 'Servicios'),
('María González', 'maria@example.com', '+54 11 3456-7890', 'Diseño de logo y branding', 1, 45000.00, 45000.00, '2024-01-18 14:20:00', 'Diseño'),
('Carlos López', 'carlos@example.com', '+54 11 4567-8901', 'Consultoría IT - 5 horas', 5, 8000.00, 40000.00, '2024-01-22 09:15:00', 'Consultoría'),
('Ana Martínez', 'ana@example.com', '+54 11 5678-9012', 'App móvil iOS y Android', 1, 250000.00, 250000.00, '2024-02-05 11:00:00', 'Desarrollo'),
('Pedro Rodríguez', 'pedro@example.com', '+54 11 6789-0123', 'Mantenimiento mensual', 1, 30000.00, 30000.00, '2024-02-10 16:45:00', 'Servicios'),
('Laura Fernández', 'laura@example.com', '+54 11 7890-1234', 'SEO y posicionamiento', 1, 55000.00, 55000.00, '2024-02-14 13:30:00', 'Marketing'),
('Diego Silva', 'diego@example.com', '+54 11 8901-2345', 'Hosting y dominio anual', 1, 25000.00, 25000.00, '2024-02-20 10:00:00', 'Infraestructura'),
('Sofía Morales', 'sofia@example.com', '+54 11 9012-3456', 'Capacitación equipo - 3 días', 3, 20000.00, 60000.00, '2024-03-01 09:00:00', 'Capacitación');

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_category ON sales(category);
CREATE INDEX IF NOT EXISTS idx_sales_transfer_id ON sales(transfer_id);
