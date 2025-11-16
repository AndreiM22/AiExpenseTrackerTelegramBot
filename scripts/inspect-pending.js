#!/usr/bin/env node
/* eslint-disable no-console */
const path = require("path");

const prismaModulePath = path.join(__dirname, "..", "apps", "web", "node_modules", "@prisma", "client");
// eslint-disable-next-line import/no-dynamic-require, global-require
const { PrismaClient } = require(prismaModulePath);

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./apps/web/prisma/dev.db";
}

const prisma = new PrismaClient();

async function main() {
  const pending = await prisma.pendingExpense.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  if (!pending.length) {
    console.log("Nu există cheltuieli în așteptare.");
    return;
  }

  console.log(`Ultimele ${pending.length} cheltuieli pending:\n`);
  for (const entry of pending) {
    console.log(
      `• ${entry.id} | status: ${entry.status} | sursă: ${entry.source} | creat: ${entry.createdAt?.toISOString?.() ?? entry.createdAt
      }`
    );
    if (entry.rawText) {
      console.log(`  Text: ${entry.rawText}`);
    }
    if (entry.correctedText) {
      console.log(`  Corectat: ${entry.correctedText}`);
    }
    console.log("");
  }
}

main()
  .catch((error) => {
    console.error("Nu am putut lista pending-urile:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
