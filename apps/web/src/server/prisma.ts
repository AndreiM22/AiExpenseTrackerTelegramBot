import { PrismaClient } from "@prisma/client";

// Use DATABASE_URL from environment - required in production
// In Docker: file:/data/prisma/dev.db
// In local dev: file:./prisma/dev.db (from .env)
if (!process.env.DATABASE_URL) {
  // Fallback for local development only
  process.env.DATABASE_URL = "file:./prisma/dev.db";
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
