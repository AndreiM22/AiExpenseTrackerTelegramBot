FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app/apps/web
COPY apps/web/package*.json ./
RUN npm install --ignore-scripts

FROM base AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN cd apps/web && npx prisma generate --schema prisma/schema.prisma
RUN cd apps/web && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN apk add --no-cache libc6-compat sqlite && mkdir -p /data/prisma
COPY apps/web/package*.json ./apps/web/
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder /app/apps/web/tsconfig.json ./apps/web/
COPY --from=builder /app/apps/web/src ./apps/web/src
COPY --from=builder /app/apps/web/prisma ./apps/web/prisma
COPY --from=builder /app/apps/web/scripts ./apps/web/scripts

# Health check - verify API is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/categories || exit 1

EXPOSE 3000

# Use entrypoint script for initialization
ENTRYPOINT ["/app/apps/web/scripts/docker-entrypoint.sh"]
