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

function createPool(): Pool {
  const p = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    // Supabase's pooler (port 6543) has a small SHARED connection cap. A
    // client-side max of 20 — multiplied across N Vercel serverless instances
    // — exhausts it and surfaces as "FATAL: too many clients already" (the
    // "max client limit reached" error). Keep the client pool small; the
    // pooler multiplexes connections for us.
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    // A runaway/queued query can't hold a pooled connection forever and starve
    // the whole pool (a frequent cause of "too many clients already").
    statement_timeout: 30000,
  });
  // Idle connections that drop (pooler resets, network blips) otherwise throw
  // unhandled 'error' events and can crash a request / serverless instance.
  p.on("error", (err) => {
    console.error("[PG POOL] idle client error:", err.message);
  });
  return p;
}

if (process.env.NODE_ENV === "production") {
  pool = createPool();
} else {
  if (!global.__shopy_pg_pool) {
    global.__shopy_pg_pool = createPool();
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
