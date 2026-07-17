import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to run migrations.");

const client = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 10 });
try {
  await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  console.log("Database migrations completed.");
} finally {
  await client.end();
}
