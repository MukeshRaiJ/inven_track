// src/lib/types.ts
export interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  category: string;
}

export interface ProductInput {
  name: string;
  quantity: number;
  price: number;
  category: string;
}
