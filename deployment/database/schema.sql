-- Contracts SaaS Database Schema
-- PostgreSQL 15+

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create resellers table (referenced by customers)
CREATE TABLE IF NOT EXISTS resellers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    margin_percentage DECIMAL(5, 2) DEFAULT 0,
    street TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'USA',
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table with separated name fields and full address
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    name TEXT, -- Legacy field for backward compatibility
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    customer_type TEXT NOT NULL DEFAULT 'individual',
    reseller_id INTEGER REFERENCES resellers(id) ON DELETE SET NULL,
    street TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'USA',
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    can_login BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active',
    assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    approved_at TIMESTAMP,
    approved_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table with bundle support
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_bundle BOOLEAN DEFAULT false,
    bundle_products TEXT, -- JSON array of product IDs
    original_price DECIMAL(10, 2),
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reseller contacts table
CREATE TABLE IF NOT EXISTS reseller_contacts (
    id SERIAL PRIMARY KEY,
    reseller_id INTEGER REFERENCES resellers(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    title TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contracts table with lifecycle management
CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    reseller_id INTEGER REFERENCES resellers(id) ON DELETE SET NULL,
    contract_term INTEGER NOT NULL DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    billing_cycle TEXT NOT NULL DEFAULT 'annual',
    billing_status TEXT NOT NULL DEFAULT 'PENDING',
    amount DECIMAL(10, 2) NOT NULL,
    reseller_margin DECIMAL(5, 2) DEFAULT 0,
    net_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    po_number TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_reseller_id ON customers(reseller_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to_id ON customers(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_product_id ON contracts(product_id);
CREATE INDEX IF NOT EXISTS idx_contracts_reseller_id ON contracts(reseller_id);
CREATE INDEX IF NOT EXISTS idx_contracts_billing_status ON contracts(billing_status);
CREATE INDEX IF NOT EXISTS idx_reseller_contacts_reseller_id ON reseller_contacts(reseller_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_contract_id ON purchase_orders(contract_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_customer_id ON purchase_orders(customer_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resellers_updated_at BEFORE UPDATE ON resellers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reseller_contacts_updated_at BEFORE UPDATE ON reseller_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();