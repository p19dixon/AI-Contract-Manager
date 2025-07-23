-- Migration to add reseller relationships to match ERD

-- Add reseller_id to customers table to establish reseller-customer relationship
ALTER TABLE customers ADD COLUMN reseller_id INTEGER REFERENCES resellers(id) ON DELETE SET NULL;

-- Add additional fields to resellers table
ALTER TABLE resellers ADD COLUMN street TEXT;
ALTER TABLE resellers ADD COLUMN city TEXT;
ALTER TABLE resellers ADD COLUMN state TEXT;
ALTER TABLE resellers ADD COLUMN zip_code TEXT;
ALTER TABLE resellers ADD COLUMN country TEXT DEFAULT 'USA';
ALTER TABLE resellers ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE resellers ADD COLUMN notes TEXT;

-- Create reseller_contacts table for staff members (Point of Contact)
CREATE TABLE reseller_contacts (
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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_customers_reseller_id ON customers(reseller_id);
CREATE INDEX idx_reseller_contacts_reseller_id ON reseller_contacts(reseller_id);
CREATE INDEX idx_reseller_contacts_is_primary ON reseller_contacts(is_primary);
CREATE INDEX idx_reseller_contacts_is_active ON reseller_contacts(is_active);

-- Add comments for documentation
COMMENT ON COLUMN customers.reseller_id IS 'Link to reseller - for reseller customers (companies who buy from the reseller)';
COMMENT ON TABLE reseller_contacts IS 'Staff members who work for the reseller (Point of Contact)';
COMMENT ON COLUMN reseller_contacts.is_primary IS 'Is this the primary contact for the reseller?';