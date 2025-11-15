#!/bin/sh
set -e

echo "🚀 Starting Expense Bot AI..."

# Navigate to app directory
cd /app/apps/web

# Check if database directory exists
if [ ! -d "/data/prisma" ]; then
  echo "📁 Creating database directory..."
  mkdir -p /data/prisma
fi

# Run Prisma migrations
echo "🔄 Applying database migrations..."
npx prisma migrate deploy --schema prisma/schema.prisma

# Check if database is empty and seed if needed
echo "🌱 Checking if database needs seeding..."
# Count tables to see if DB is initialized
TABLE_COUNT=$(sqlite3 /data/prisma/dev.db "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -eq "0" ]; then
  echo "⚠️  Database is empty, migrations might have failed"
fi

# Optional: Run seed script if it exists
if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
  echo "🌱 Running database seed..."
  npx prisma db seed || echo "⚠️  Seed script not found or failed (this is OK for now)"
fi

# Generate Prisma Client (in case it's not in node_modules)
echo "⚙️  Generating Prisma Client..."
npx prisma generate --schema prisma/schema.prisma

# Go back to root
cd /app

# Start the application
echo "✅ Starting Next.js application..."
exec npm run start --prefix apps/web
