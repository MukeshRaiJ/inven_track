// app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const {
      brand_name,
      model_name,
      style_code,
      category,
      color,
      gender,
      retail_price,
      size,
      quantity,
    } = await req.json();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update products table
      await client.query(
        `UPDATE products 
         SET brand_name = $1,
             model_name = $2,
             style_code = $3,
             category = $4,
             color = $5,
             gender = $6,
             retail_price = $7,
             created_at = CURRENT_TIMESTAMP
         WHERE product_id = $8`,
        [
          brand_name,
          model_name,
          style_code,
          category,
          color,
          gender,
          retail_price,
          id,
        ]
      );

      // Get the current inventory record
      const inventoryResult = await client.query(
        `SELECT i.inventory_id, i.size_id, i.quantity as current_quantity
         FROM inventory i
         WHERE i.product_id = $1`,
        [id]
      );

      const inventoryRecord = inventoryResult.rows[0];

      // Update sizes table
      await client.query(
        `UPDATE sizes 
         SET uk_size = $1,
             india_size = $2,
             width_type = $3,
             gender = $4
         WHERE size_id = $5`,
        [
          size.uk_size,
          size.india_size,
          size.width_type,
          size.gender,
          inventoryRecord.size_id,
        ]
      );

      // Calculate quantity difference
      const quantityDifference = quantity - inventoryRecord.current_quantity;

      // Update inventory
      await client.query(
        `UPDATE inventory 
         SET quantity = $1,
             last_updated = CURRENT_TIMESTAMP
         WHERE inventory_id = $2`,
        [quantity, inventoryRecord.inventory_id]
      );

      // Record the transaction if quantity changed
      if (quantityDifference !== 0) {
        await client.query(
          `INSERT INTO inventory_transactions 
           (inventory_id, transaction_type, quantity, notes)
           VALUES ($1, $2, $3, $4)`,
          [
            inventoryRecord.inventory_id,
            quantityDifference > 0 ? "STOCK_ADDITION" : "STOCK_REDUCTION",
            Math.abs(quantityDifference),
            "Stock update via product modification",
          ]
        );
      }

      await client.query("COMMIT");

      // Fetch updated product data
      const result = await client.query(
        `SELECT p.*, i.quantity
         FROM products p
         LEFT JOIN inventory i ON p.product_id = i.product_id
         WHERE p.product_id = $1`,
        [id]
      );

      return NextResponse.json(result.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
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
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get inventory_id before deletion
      const inventoryResult = await client.query(
        "SELECT inventory_id FROM inventory WHERE product_id = $1",
        [id]
      );

      if (inventoryResult.rows.length > 0) {
        const inventoryId = inventoryResult.rows[0].inventory_id;

        // Delete inventory transactions first
        await client.query(
          "DELETE FROM inventory_transactions WHERE inventory_id = $1",
          [inventoryId]
        );

        // Delete inventory record
        await client.query("DELETE FROM inventory WHERE product_id = $1", [id]);
      }

      // Delete the product
      await client.query("DELETE FROM products WHERE product_id = $1", [id]);

      await client.query("COMMIT");
      return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
