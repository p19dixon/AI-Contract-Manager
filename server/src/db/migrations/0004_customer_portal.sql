-- Customer Portal Migration
-- Add customer portal fields to customers table and create purchase_orders table

-- Add new columns to customers table
ALTER TABLE customers 
ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN can_login BOOLEAN DEFAULT FALSE;

-- Update users table to support customer role
ALTER TABLE users 
ALTER COLUMN role DROP DEFAULT,
ADD CONSTRAINT check_role CHECK (role IN ('user', 'admin', 'customer'));

-- Set default role back to 'user'
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- Create purchase_orders table
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    po_number TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_can_login ON customers(can_login);
CREATE INDEX idx_purchase_orders_contract_id ON purchase_orders(contract_id);
CREATE INDEX idx_purchase_orders_customer_id ON purchase_orders(customer_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);