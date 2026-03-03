import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const original = process.env.DATABASE_URL || "";
const pooler = original
  .replace(
    "ep-young-river-adgkr8vl.c-2.us-east-1.aws.neon.tech",
    "ep-young-river-adgkr8vl-pooler.c-2.us-east-1.aws.neon.tech",
  )
  .replace("channel_binding=require", "channel_binding=prefer");

async function test(name, url) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    console.log(`${name}: OK`, result);
  } catch (error) {
    console.log(`${name}: ERROR`, error?.message || error);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

console.log("Testing Neon direct vs pooler...");
await test("DIRECT", original);
await test("POOLER", pooler);
