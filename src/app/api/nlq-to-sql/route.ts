import { NextResponse } from "next/server";
import snowflake from "snowflake-sdk";

const getConnectionConfig = () => {
  const token = process.env.SNOWFLAKE_PAT;
  const password = process.env.SNOWFLAKE_PASSWORD;
  
  const baseConfig = {
    account: process.env.SNOWFLAKE_ACCOUNT || "SFSENORTHAMERICA-DEMO_MMALVEIRA",
    username: process.env.SNOWFLAKE_USER || "MMALVEIRA",
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || "GEN2_SMALL",
    database: process.env.SNOWFLAKE_DATABASE || "LANDING_CO",
    schema: process.env.SNOWFLAKE_SCHEMA || "FLATFILES",
  };

  if (token) {
    return {
      ...baseConfig,
      authenticator: "PROGRAMMATIC_ACCESS_TOKEN",
      token: token,
    };
  }
  
  return {
    ...baseConfig,
    password: password || "",
  };
};

async function executeQuery(sql: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const connection = snowflake.createConnection(getConnectionConfig());
    
    connection.connect((err) => {
      if (err) {
        reject(err);
        return;
      }
      
      connection.execute({
        sqlText: sql,
        complete: (err, stmt, rows) => {
          connection.destroy((destroyErr) => {
            if (destroyErr) console.error("Error destroying connection:", destroyErr);
          });
          
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        },
      });
    });
  });
}

const SCHEMA_CONTEXT = `You are a SQL expert. Generate a Snowflake SQL query based on the user's question.

Available tables in LANDING_CO.FLATFILES:

1. DYNAMIC_PLANNING_SALES_FORECAST - Sales forecasts with columns: PRODUCT_ID, PRODUCT_NAME, REGION, FORECAST_DATE, FORECAST_AMOUNT, CATEGORY

2. DYNAMIC_PLANNING_INVENTORY - Inventory data with columns: PRODUCT_ID, PRODUCT_NAME, WAREHOUSE, QUANTITY, LAST_UPDATED

3. DYNAMIC_PLANNING_RETAILER - Retailer info with columns: RETAILER_ID, RETAILER_NAME, REGION, SALES_VOLUME, TIER

4. DYNAMIC_PLANNING_SALES_INVOICE - Invoice data with columns: INVOICE_ID, PRODUCT_ID, RETAILER_ID, SALE_DATE, QUANTITY, AMOUNT

5. DYNAMIC_PLANNING_IRON_SHARE_GTD - Iron market share with columns: MANUFACTURER, MODEL, UNIT_SALES, MARKET_SHARE, YEAR, CATEGORY

Rules:
- Always use fully qualified table names (LANDING_CO.FLATFILES.TABLE_NAME)
- Only generate SELECT queries
- Return ONLY the SQL query, no explanations
- Limit results to 100 rows unless specified otherwise`;

function logCurlCommand(model: string, prompt: string) {
  const account = process.env.SNOWFLAKE_ACCOUNT || "SFSENORTHAMERICA-DEMO_MMALVEIRA";
  const token = process.env.SNOWFLAKE_PAT || "<YOUR_PAT_TOKEN>";
  
  const payload = {
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    top_p: 1
  };

  const curl = `
================================================================================
CORTEX REST API - NLQ-to-SQL CURL COMMAND
================================================================================
curl -X POST \\
  "https://${account}.snowflakecomputing.com/api/v2/cortex/inference:complete" \\
  -H "Authorization: Bearer ${token.substring(0, 20)}...${token.substring(token.length - 10)}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '${JSON.stringify(payload, null, 2)}'
================================================================================
`;
  console.log(curl);
}

const MODEL_MAP: Record<string, string> = {
  "claude-sonnet-4-5": "claude-3-5-sonnet",
  "claude-3-5-sonnet": "claude-3-5-sonnet",
  "llama3.1-70b": "llama3.1-70b",
  "llama3.1-8b": "llama3.1-8b",
  "mistral-large2": "mistral-large2",
  "snowflake-llama-3.3-70b": "snowflake-llama-3.3-70b",
};

export async function POST(request: Request) {
  try {
    const { question, model = "claude-sonnet-4-5" } = await request.json();

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const sqlModel = MODEL_MAP[model] || "claude-3-5-sonnet";
    const prompt = `${SCHEMA_CONTEXT}\n\nUser question: ${question}\n\nSQL Query:`;
    
    logCurlCommand(sqlModel, prompt);
    
    const escapedPrompt = prompt.replace(/'/g, "''");

    const generateSqlQuery = `
      SELECT AI_COMPLETE(
        '${sqlModel}',
        '${escapedPrompt}'
      ) as response
    `;

    console.log("\n📝 SQL Query for LLM:\n", generateSqlQuery, "\n");

    const sqlRows = await executeQuery(generateSqlQuery) as { RESPONSE: string }[];
    
    if (!sqlRows || sqlRows.length === 0) {
      return NextResponse.json({ error: "Failed to generate SQL" }, { status: 500 });
    }

    let generatedSql = sqlRows[0].RESPONSE;
    
    if (typeof generatedSql === "string" && generatedSql.startsWith("{")) {
      try {
        const parsed = JSON.parse(generatedSql);
        generatedSql = parsed.choices?.[0]?.messages || parsed.content || generatedSql;
      } catch {}
    }

    generatedSql = generatedSql.trim();
    if (generatedSql.startsWith("```sql")) {
      generatedSql = generatedSql.replace(/```sql\n?/, "").replace(/```$/, "");
    }
    if (generatedSql.startsWith("```")) {
      generatedSql = generatedSql.replace(/```\n?/, "").replace(/```$/, "");
    }
    generatedSql = generatedSql.trim();

    console.log("\n✅ Generated SQL:\n", generatedSql, "\n");

    const upperSql = generatedSql.toUpperCase();
    if (!upperSql.startsWith("SELECT")) {
      return NextResponse.json({ 
        error: "Generated query is not a SELECT statement",
        sql: generatedSql 
      }, { status: 400 });
    }

    const dangerousKeywords = ["DROP", "DELETE", "TRUNCATE", "INSERT", "UPDATE", "ALTER", "CREATE", "GRANT", "REVOKE"];
    for (const keyword of dangerousKeywords) {
      if (upperSql.includes(keyword)) {
        return NextResponse.json({ 
          error: `Generated query contains forbidden keyword: ${keyword}`,
          sql: generatedSql 
        }, { status: 400 });
      }
    }

    const results = await executeQuery(generatedSql) as Record<string, unknown>[];

    console.log(`\n📊 Query returned ${results.length} rows\n`);

    return NextResponse.json({ 
      sql: generatedSql,
      results: results.slice(0, 100),
      rowCount: results.length
    });

  } catch (error) {
    console.error("Error in nlq-to-sql:", error);
    return NextResponse.json(
      { error: `Failed to process query: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
