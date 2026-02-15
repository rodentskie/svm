-- Remove index
DROP INDEX IF EXISTS idx_products_category_id;

-- Remove category_id column from products table
ALTER TABLE products
DROP COLUMN IF EXISTS category_id;
