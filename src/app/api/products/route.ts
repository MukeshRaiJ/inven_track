// app/api/products/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.*,
        s.uk_size,
        s.india_size,
        s.width_type as size_width_type,
        s.gender as size_gender,
        i.quantity,
        i.min_stock_level
      FROM products p
      LEFT JOIN inventory i ON p.product_id = i.product_id
      LEFT JOIN sizes s ON i.size_id = s.size_id
    `;

    let countQuery = "SELECT COUNT(*) FROM products p";
    const queryParams = [];
    const countParams = [];

    if (search) {
      const searchCondition = `
        WHERE p.brand_name ILIKE $1 
        OR p.model_name ILIKE $1 
        OR p.style_code ILIKE $1 
        OR p.category ILIKE $1
      `;
      query += searchCondition;
      countQuery += searchCondition;
      queryParams.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += ` ORDER BY p.product_id LIMIT $${queryParams.length + 1} OFFSET $${
      queryParams.length + 2
    }`;
    queryParams.push(limit, offset);

    const [itemsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countParams),
    ]);

    // Transform the results to include size info in a nested object
    const transformedItems = itemsResult.rows.map((row) => ({
      product_id: row.product_id,
      brand_name: row.brand_name,
      model_name: row.model_name,
      style_code: row.style_code,
      category: row.category,
      color: row.color,
      gender: row.gender,
      retail_price: row.retail_price,
      quantity: row.quantity,
      min_stock_level: row.min_stock_level,
      created_at: row.created_at,
      size: {
        uk_size: row.uk_size,
        india_size: row.india_size,
        width_type: row.size_width_type,
        gender: row.size_gender,
      },
    }));

    return NextResponse.json({
      items: transformedItems,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const body = await req.json();
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
      min_stock_level = 5, // Default value if not provided
    } = body;

    await client.query("BEGIN");

    // 1. Insert into products table
    const productResult = await client.query(
      `INSERT INTO products 
       (brand_name, model_name, style_code, category, color, gender, retail_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING product_id`,
      [
        brand_name,
        model_name,
        style_code,
        category,
        color,
        gender,
        retail_price,
      ]
    );

    const product_id = productResult.rows[0].product_id;

    // 2. Insert into sizes table
    const sizeResult = await client.query(
      `INSERT INTO sizes 
       (uk_size, india_size, width_type, gender)
       VALUES ($1, $2, $3, $4)
       RETURNING size_id`,
      [size.uk_size, size.india_size, size.width_type, size.gender]
    );

    const size_id = sizeResult.rows[0].size_id;

    // 3. Insert into inventory table
    const inventoryResult = await client.query(
      `INSERT INTO inventory 
       (product_id, size_id, quantity, min_stock_level)
       VALUES ($1, $2, $3, $4)
       RETURNING inventory_id`,
      [product_id, size_id, quantity, min_stock_level]
    );

    const inventory_id = inventoryResult.rows[0].inventory_id;

    // 4. Record the initial stock transaction
    await client.query(
      `INSERT INTO inventory_transactions 
       (inventory_id, transaction_type, quantity, notes)
       VALUES ($1, 'INITIAL_STOCK', $2, 'Initial stock creation')`,
      [inventory_id, quantity]
    );

    await client.query("COMMIT");

    // Fetch the complete product data to return
    const result = await client.query(
      `SELECT 
        p.*,
        s.uk_size,
        s.india_size,
        s.width_type as size_width_type,
        s.gender as size_gender,
        i.quantity,
        i.min_stock_level
       FROM products p
       LEFT JOIN inventory i ON p.product_id = i.product_id
       LEFT JOIN sizes s ON i.size_id = s.size_id
       WHERE p.product_id = $1`,
      [product_id]
    );

    // Transform the result to match the expected format
    const product = result.rows[0];
    const transformedProduct = {
      product_id: product.product_id,
      brand_name: product.brand_name,
      model_name: product.model_name,
      style_code: product.style_code,
      category: product.category,
      color: product.color,
      gender: product.gender,
      retail_price: product.retail_price,
      quantity: product.quantity,
      min_stock_level: product.min_stock_level,
      created_at: product.created_at,
      size: {
        uk_size: product.uk_size,
        india_size: product.india_size,
        width_type: product.size_width_type,
        gender: product.size_gender,
      },
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
