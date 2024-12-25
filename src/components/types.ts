// types.ts
export interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  category: string;
  last_updated: string;
}

export type ProductInput = Omit<Product, "id" | "last_updated">;
