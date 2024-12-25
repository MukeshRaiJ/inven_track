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

    let query = "SELECT * FROM products";
    let countQuery = "SELECT COUNT(*) FROM products";
    const queryParams = [];
    const countParams = [];

    if (search) {
      query += " WHERE name ILIKE $1 OR category ILIKE $1";
      countQuery += " WHERE name ILIKE $1 OR category ILIKE $1";
      queryParams.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query +=
      " ORDER BY id LIMIT $" +
      (queryParams.length + 1) +
      " OFFSET $" +
      (queryParams.length + 2);
    queryParams.push(limit, offset);

    const [itemsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countParams),
    ]);

    return NextResponse.json({
      items: itemsResult.rows,
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
  try {
    const body = await req.json();
    const { name, quantity, price, category } = body;

    const result = await pool.query(
      "INSERT INTO products (name, quantity, price, category) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, quantity, price, category]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
