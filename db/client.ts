import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV === "production") {
  console.warn("DATABASE_URL is not configured. Commerce routes will be unavailable.");
}

const client = databaseUrl
  ? postgres(databaseUrl, { max: 10, idle_timeout: 20, connect_timeout: 10 })
  : undefined;

export const db = client ? drizzle(client, { schema }) : undefined;
export { client };

export function requireDb() {
  if (!db) throw new Error("Database is not configured.");
  return db;
}
