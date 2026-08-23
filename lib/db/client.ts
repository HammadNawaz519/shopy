import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.apcaymgrxzjrlbtnohxx:Hammad519..@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

// Singleton PostgreSQL Connection Pool
let pool: Pool;

declare global {
  // eslint-disable-next-line no-var
  var __shopy_pg_pool: Pool | undefined;
}

if (process.env.NODE_ENV === "production") {
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
  });
} else {
  if (!global.__shopy_pg_pool) {
    global.__shopy_pg_pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
    });
  }
  pool = global.__shopy_pg_pool;
}

/**
 * Execute a parameterized SQL query on Supabase PostgreSQL.
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development" && duration > 500) {
      console.log(`[PG SLOW QUERY] ${duration}ms: ${text}`);
    }
    return res;
  } catch (err: any) {
    console.error("[PG ERROR]", err.message, "SQL:", text);
    throw err;
  }
}

/**
 * Execute a callback within an isolated PostgreSQL transaction (ACID).
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export { pool };
