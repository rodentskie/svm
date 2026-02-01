const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';

export async function fetchCategories() {
  const response = await fetch(`${API_BASE_URL}/products/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
}

export async function fetchProductsByCategory(categoryId: number) {
  const response = await fetch(`${API_BASE_URL}/products?category_id=${categoryId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
}
