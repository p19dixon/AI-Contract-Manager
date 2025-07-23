-- Seed data for Contracts SaaS
-- Creates initial admin user and sample data

-- Hash for password 'admin123' (you should change this!)
-- In production, use proper password hashing
INSERT INTO users (email, name, password, role) VALUES 
('admin@caplocations.com', 'System Admin', '$2b$10$UNb4dXSVcjFb6b/ZeuwJcub3wAwoU8glCRXVhrrK/h51KXHtPQ.2m', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample product categories
INSERT INTO products (name, description, category, base_price, is_active) VALUES
('Full File License', 'Complete data access for all locations', 'full file', 10000.00, true),
('Lite License', 'Basic data access for essential locations', 'lite', 5000.00, true),
('Online Access', 'Web-based data access portal', 'online', 3000.00, true),
('Anchors & Tenants', 'Major retail anchor and tenant data', 'anchors & tenants', 7500.00, true)
ON CONFLICT DO NOTHING;

-- Insert sample reseller
INSERT INTO resellers (name, email, phone, margin_percentage, city, state, is_active) VALUES
('Premier Data Solutions', 'contact@premierdatasolutions.com', '555-0100', 15.00, 'New York', 'NY', true)
ON CONFLICT DO NOTHING;

-- Insert sample customers
INSERT INTO customers (first_name, last_name, company, email, phone, customer_type, city, state) VALUES
('John', 'Smith', 'Retail Analytics Corp', 'john.smith@retailanalytics.com', '555-0101', 'partner', 'Chicago', 'IL'),
('Sarah', 'Johnson', 'Market Insights LLC', 'sarah.johnson@marketinsights.com', '555-0102', 'individual', 'Los Angeles', 'CA'),
('Michael', 'Brown', 'Location Intelligence Inc', 'michael.brown@locationintel.com', '555-0103', 'solution_provider', 'Dallas', 'TX')
ON CONFLICT DO NOTHING;

-- Grant permissions on newly created data
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO contracts_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO contracts_user;