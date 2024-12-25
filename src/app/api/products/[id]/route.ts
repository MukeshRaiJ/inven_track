// app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const { name, quantity, price, category } = await req.json();
    const result = await pool.query(
      "UPDATE products SET name=$1, quantity=$2, price=$3, category=$4, last_updated=CURRENT_TIMESTAMP WHERE id=$5 RETURNING *",
      [name, quantity, price, category, id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    await pool.query("DELETE FROM products WHERE id=$1", [id]);
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
