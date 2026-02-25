import snowflake from "snowflake-sdk";
import fs from "fs";

snowflake.configure({ logLevel: "ERROR" });

let connection: snowflake.Connection | null = null;
let cachedToken: string | null = null;

const CONNECTION_TIMEOUT = 15000;
const QUERY_TIMEOUT = 120000;

function getOAuthToken(): string | null {
  const tokenPath = "/snowflake/session/token";
  try {
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, "utf8");
    }
  } catch {
    // Not in SPCS environment
  }
  return null;
}

function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMsg)), ms)
    )
  ]);
}

function getConfig(): snowflake.ConnectionOptions {
  const token = getOAuthToken();
  
  if (token) {
    return {
      account: process.env.SNOWFLAKE_ACCOUNT || "SFSENORTHAMERICA-DEMO_MMALVEIRA",
      warehouse: process.env.SNOWFLAKE_WAREHOUSE || "GEN2_SMALL",
      database: process.env.SNOWFLAKE_DATABASE || "LANDING_CO",
      schema: process.env.SNOWFLAKE_SCHEMA || "FLATFILES",
      host: process.env.SNOWFLAKE_HOST,
      token,
      authenticator: "oauth",
    };
  }

  return {
    account: process.env.SNOWFLAKE_ACCOUNT || "SFSENORTHAMERICA-DEMO_MMALVEIRA",
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || "GEN2_SMALL",
    database: process.env.SNOWFLAKE_DATABASE || "LANDING_CO",
    schema: process.env.SNOWFLAKE_SCHEMA || "FLATFILES",
    username: process.env.SNOWFLAKE_USER || "MMALVEIRA",
    password: process.env.SNOWFLAKE_PASSWORD || "",
  };
}

async function getConnection(): Promise<snowflake.Connection> {
  const token = getOAuthToken();

  if (connection && (!token || token === cachedToken)) {
    return connection;
  }

  if (connection) {
    console.log("Token changed, reconnecting");
    connection.destroy(() => {});
  }

  console.log(token ? "Connecting with OAuth token" : "Connecting with username/password");
  const conn = snowflake.createConnection(getConfig());
  
  const connectPromise = withTimeout(
    new Promise<snowflake.Connection>((resolve, reject) => {
      conn.connect((err) => {
        if (err) {
          console.error("Connection error:", err.message);
          reject(err);
        } else {
          resolve(conn);
        }
      });
    }),
    CONNECTION_TIMEOUT,
    `Snowflake connection timed out after ${CONNECTION_TIMEOUT / 1000}s`
  );
  
  connection = await connectPromise;
  cachedToken = token;
  return connection;
}

function isRetryableError(err: unknown): boolean {
  const error = err as { message?: string; code?: number };
  return !!(
    error.message?.includes("OAuth access token expired") ||
    error.message?.includes("terminated connection") ||
    error.code === 407002
  );
}

export async function query<T>(sql: string, retries = 1): Promise<T[]> {
  try {
    const conn = await getConnection();
    return await withTimeout(
      new Promise<T[]>((resolve, reject) => {
        conn.execute({
          sqlText: sql,
          complete: (err, stmt, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve((rows || []) as T[]);
            }
          },
        });
      }),
      QUERY_TIMEOUT,
      `Query timed out after ${QUERY_TIMEOUT / 1000}s`
    );
  } catch (err) {
    console.error("Query error:", (err as Error).message);
    if (retries > 0 && isRetryableError(err)) {
      connection = null;
      return query(sql, retries - 1);
    }
    throw err;
  }
}
