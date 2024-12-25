// page.tsx (index.tsx)
"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import useStore from "@/components/store";
import { ProductFormData } from "@/components/types";

const ITEMS_PER_PAGE = 15;

// Helper function to format price
const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return "0.00";
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2);
};

export default function ProductManager() {
  const { products, loading, error, fetchProducts, addProduct, deleteProduct } =
    useStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<ProductFormData>({
    brand_name: "",
    model_name: "",
    style_code: "",
    category: "",
    color: "",
    gender: "",
    retail_price: 0,
    size: {
      uk_size: 0,
      india_size: 0,
      width_type: "",
      gender: "",
    },
    quantity: 0,
    min_stock_level: 5,
  });

  useEffect(() => {
    fetchProducts(currentPage, ITEMS_PER_PAGE, searchTerm);
  }, [fetchProducts, currentPage, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addProduct(formData);
    setFormData({
      brand_name: "",
      model_name: "",
      style_code: "",
      category: "",
      color: "",
      gender: "",
      retail_price: 0,
      size: {
        uk_size: 0,
        india_size: 0,
        width_type: "",
        gender: "",
      },
      quantity: 0,
      min_stock_level: 5,
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredProducts = Array.isArray(products?.items) ? products.items : [];
  const totalPages = Math.ceil((products?.total || 0) / ITEMS_PER_PAGE);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Brand Name"
                value={formData.brand_name}
                onChange={(e) =>
                  setFormData({ ...formData, brand_name: e.target.value })
                }
                required
              />
              <Input
                placeholder="Model Name"
                value={formData.model_name}
                onChange={(e) =>
                  setFormData({ ...formData, model_name: e.target.value })
                }
                required
              />
              <Input
                placeholder="Style Code"
                value={formData.style_code}
                onChange={(e) =>
                  setFormData({ ...formData, style_code: e.target.value })
                }
                required
              />
              <Input
                placeholder="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              />
              <Input
                placeholder="Color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                required
              />
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unisex">Unisex</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                placeholder="Retail Price"
                value={formData.retail_price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    retail_price: Number(e.target.value),
                  })
                }
                required
                min="0"
              />
              <Input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: Number(e.target.value) })
                }
                required
                min="0"
              />
              <Input
                type="number"
                placeholder="Min Stock Level"
                value={formData.min_stock_level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_stock_level: Number(e.target.value),
                  })
                }
                required
                min="0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                step="0.1"
                placeholder="UK Size"
                value={formData.size.uk_size}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    size: { ...formData.size, uk_size: Number(e.target.value) },
                  })
                }
                required
              />
              <Input
                type="number"
                step="0.1"
                placeholder="India Size"
                value={formData.size.india_size}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    size: {
                      ...formData.size,
                      india_size: Number(e.target.value),
                    },
                  })
                }
                required
              />
              <Input
                placeholder="Width Type"
                value={formData.size.width_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    size: { ...formData.size, width_type: e.target.value },
                  })
                }
                required
              />
              <Select
                value={formData.size.gender}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    size: { ...formData.size, gender: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Size Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unisex">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Add Product
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Product List</CardTitle>
          <div className="w-72">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Brand</TableHead>
                      <TableHead className="w-[150px]">Model</TableHead>
                      <TableHead className="w-[120px]">Style Code</TableHead>
                      <TableHead className="w-[120px]">Category</TableHead>
                      <TableHead className="w-[100px]">Color</TableHead>
                      <TableHead className="w-[100px]">Gender</TableHead>
                      <TableHead className="w-[100px]">Price</TableHead>
                      <TableHead className="w-[100px]">Quantity</TableHead>
                      <TableHead className="w-[100px]">Stock Level</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product, index) => (
                      <TableRow
                        key={`${product.product_id}-${product.style_code}-${index}`}
                      >
                        <TableCell>{product.brand_name}</TableCell>
                        <TableCell>{product.model_name}</TableCell>
                        <TableCell>{product.style_code}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.color}</TableCell>
                        <TableCell>{product.gender}</TableCell>
                        <TableCell>
                          ${formatPrice(product.retail_price)}
                        </TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>{product.min_stock_level}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            onClick={() => deleteProduct(product.product_id)}
                            className="w-full"
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, products?.total || 0)}{" "}
                  of {products?.total || 0} items
                </div>
                <div className="flex gap-2">
                  <Button
                    key={`prev-page-${currentPage}`}
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((num) => {
                      const nearCurrent = Math.abs(num - currentPage) <= 1;
                      const isFirstOrLast = num === 1 || num === totalPages;
                      return nearCurrent || isFirstOrLast;
                    })
                    .map((num, index, array) => (
                      <React.Fragment key={`page-button-${num}-${currentPage}`}>
                        {index > 0 && array[index - 1] !== num - 1 && (
                          <span
                            key={`ellipsis-${index}-${currentPage}`}
                            className="px-2"
                          >
                            ...
                          </span>
                        )}
                        <Button
                          variant={currentPage === num ? "default" : "outline"}
                          onClick={() => setCurrentPage(num)}
                        >
                          {num}
                        </Button>
                      </React.Fragment>
                    ))}
                  <Button
                    key={`next-page-${currentPage}`}
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
