// src/lib/store.ts
import { create } from "zustand";
import { Product, ProductInput } from "@/components/types_one";

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
  addProduct: (product: ProductInput) => Promise<void>;
  updateProduct: (id: number, updates: ProductInput) => Promise<void>;
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
      set({ products: data, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
        products: { items: [], total: 0 },
      });
    }
  },

  addProduct: async (product) => {
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (!response.ok) throw new Error("Failed to add product");
      const newProduct = await response.json();

      // Refresh the current page after adding
      const { products } = get();
      set((state) => ({
        products: {
          ...products,
          items: [...products.items, newProduct].slice(0, 10), // Keep only first page
          total: products.total + 1,
        },
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  },

  updateProduct: async (id, updates) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update product");
      const updatedProduct = await response.json();
      set((state) => ({
        products: {
          ...state.products,
          items: state.products.items.map((p) =>
            p.id === id ? updatedProduct : p
          ),
        },
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete product");
      set((state) => ({
        products: {
          items: state.products.items.filter((p) => p.id !== id),
          total: state.products.total - 1,
        },
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  },
}));

export default useStore;
