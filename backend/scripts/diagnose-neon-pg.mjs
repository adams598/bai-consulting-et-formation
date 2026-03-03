import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Client } = pg;
const original = process.env.DATABASE_URL || "";

async function test(url, label) {
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const r = await client.query("SELECT 1 as ok");
    console.log(`${label}: OK`, r.rows);
  } catch (e) {
    console.log(`${label}: ERROR`, {
      message: e?.message,
      code: e?.code,
      errno: e?.errno,
      syscall: e?.syscall,
      address: e?.address,
      port: e?.port,
    });
  } finally {
    await client.end().catch(() => {});
  }
}

await test(original, "PG_DIRECT");
await test(
  original
    .replace(
      "ep-young-river-adgkr8vl.c-2.us-east-1.aws.neon.tech",
      "ep-young-river-adgkr8vl-pooler.c-2.us-east-1.aws.neon.tech",
    )
    .replace("channel_binding=require", "channel_binding=prefer"),
  "PG_POOLER",
);
