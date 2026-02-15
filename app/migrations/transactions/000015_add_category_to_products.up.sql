-- Add category_id column to products table
ALTER TABLE products
ADD COLUMN category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_products_category_id ON products(category_id);
