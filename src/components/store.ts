// store.ts
import { create } from "zustand";
import { Product, ProductFormData } from "./types";

interface PaginatedProducts {
  items: Product[];
  total: number;
}

interface ProductStore {
  products: PaginatedProducts;
  loading: boolean;
  error: string | null;
  fetchProducts: (
    page: number,
    limit: number,
    search?: string
  ) => Promise<void>;
  addProduct: (product: ProductFormData) => Promise<void>;
  updateProduct: (id: number, updates: ProductFormData) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
}

const useStore = create<ProductStore>((set, get) => ({
  products: { items: [], total: 0 },
  loading: false,
  error: null,

  fetchProducts: async (page: number, limit: number, search?: string) => {
    set({ loading: true });
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/products?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();

      // Transform the data to ensure proper types
      const transformedItems = data.items.map((item: any) => ({
        ...item,
        retail_price: Number(item.retail_price),
        quantity: Number(item.quantity),
        min_stock_level: Number(item.min_stock_level),
        size: item.size
          ? {
              ...item.size,
              uk_size: Number(item.size.uk_size),
              india_size: Number(item.size.india_size),
            }
          : undefined,
      }));

      set({
        products: {
          items: transformedItems,
          total: data.total,
        },
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
        products: { items: [], total: 0 },
      });
    }
  },

  addProduct: async (product: ProductFormData) => {
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      if (!response.ok) throw new Error("Failed to add product");
      const newProduct = await response.json();

      // Transform the new product data
      const transformedProduct = {
        ...newProduct,
        retail_price: Number(newProduct.retail_price),
        quantity: Number(newProduct.quantity),
        min_stock_level: Number(newProduct.min_stock_level),
        size: newProduct.size
          ? {
              ...newProduct.size,
              uk_size: Number(newProduct.size.uk_size),
              india_size: Number(newProduct.size.india_size),
            }
          : undefined,
      };

      set((state) => ({
        products: {
          ...state.products,
          items: [...state.products.items, transformedProduct],
          total: state.products.total + 1,
        },
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  },

  updateProduct: async (id: number, updates: ProductFormData) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update product");
      const updatedProduct = await response.json();

      // Transform the updated product data
      const transformedProduct = {
        ...updatedProduct,
        retail_price: Number(updatedProduct.retail_price),
        quantity: Number(updatedProduct.quantity),
        min_stock_level: Number(updatedProduct.min_stock_level),
        size: updatedProduct.size
          ? {
              ...updatedProduct.size,
              uk_size: Number(updatedProduct.size.uk_size),
              india_size: Number(updatedProduct.size.india_size),
            }
          : undefined,
      };

      set((state) => ({
        products: {
          ...state.products,
          items: state.products.items.map((p) =>
            p.product_id === id ? transformedProduct : p
          ),
        },
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  },

  deleteProduct: async (id: number) => {
    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete product");

      set((state) => ({
        products: {
          items: state.products.items.filter((p) => p.product_id !== id),
          total: state.products.total - 1,
        },
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  },
}));

export default useStore;
