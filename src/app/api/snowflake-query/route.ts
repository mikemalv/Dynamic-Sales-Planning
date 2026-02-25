import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function POST(request: Request) {
  try {
    const { sql } = await request.json();

    if (!sql || typeof sql !== "string") {
      return NextResponse.json({ error: "SQL query is required" }, { status: 400 });
    }

    const trimmedSql = sql.trim().toUpperCase();
    if (!trimmedSql.startsWith("SELECT")) {
      return NextResponse.json(
        { error: "Only SELECT queries are allowed for safety" },
        { status: 400 }
      );
    }

    const dangerousKeywords = ["DROP", "DELETE", "TRUNCATE", "INSERT", "UPDATE", "ALTER", "CREATE", "GRANT", "REVOKE"];
    for (const keyword of dangerousKeywords) {
      if (trimmedSql.includes(keyword)) {
        return NextResponse.json(
          { error: `Query contains forbidden keyword: ${keyword}` },
          { status: 400 }
        );
      }
    }

    const results = await query<Record<string, unknown>>(sql);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Snowflake query error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to execute query" },
      { status: 500 }
    );
  }
}
