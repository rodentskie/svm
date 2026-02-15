export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  code: string;
  price: number;
  quantity: number;
  location: string;
  min_threshold: number;
  is_low_stock: boolean;
  category: Category;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
}

export interface Student {
  rfid: string;
  load: number;
}
