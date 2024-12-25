// types.ts
export interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  category: string;
  last_updated: string;
}

export interface Product {
  product_id: number;
  brand_name: string;
  model_name: string;
  style_code: string;
  category: string;
  color: string;
  gender: string;
  retail_price: number;
  quantity: number;
  min_stock_level: number;
  created_at: string;
  size?: Size;
}
export interface ProductFormData {
  brand_name: string;
  model_name: string;
  style_code: string;
  category: string;
  color: string;
  gender: string;
  retail_price: number;
  size: Size;
  quantity: number;
  min_stock_level: number;
}

export type ProductInput = Omit<Product, "id" | "last_updated">;
