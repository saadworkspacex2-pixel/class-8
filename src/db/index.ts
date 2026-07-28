import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let _db: NodePgDatabase | null = null;
let _pool: Pool | null = null;

function getDb(): NodePgDatabase {
  if (_db) return _db;
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured');
  }
  
  _pool = new Pool({ connectionString });
  _db = drizzle(_pool);
  
  return _db;
}

// Export a proxy that lazily initializes the connection
export const db = new Proxy({} as NodePgDatabase, {
  get(_, prop: string | symbol) {
    const database = getDb();
    const value = database[prop as keyof NodePgDatabase];
    if (typeof value === 'function') {
      return (value as Function).bind(database);
    }
    return value;
  },
});
