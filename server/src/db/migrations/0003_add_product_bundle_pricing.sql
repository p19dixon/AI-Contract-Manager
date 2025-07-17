-- Add bundle pricing fields to products table
ALTER TABLE products 
ADD COLUMN original_price DECIMAL(10, 2),
ADD COLUMN discount_percentage DECIMAL(5, 2) DEFAULT 0;

-- Update existing products to have discount_percentage = 0
UPDATE products SET discount_percentage = 0 WHERE discount_percentage IS NULL;