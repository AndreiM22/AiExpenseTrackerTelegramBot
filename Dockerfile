FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package*.json ./
COPY apps/web/package*.json apps/web/
COPY apps/web/package-lock.json apps/web/
RUN npm install --ignore-scripts \
 && cd apps/web && npm install --ignore-scripts

FROM base AS builder
ENV NODE_ENV=development
COPY --from=deps /app /app
COPY . .
RUN cd apps/web && npx prisma generate --schema prisma/schema.prisma
RUN cd apps/web && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN apk add --no-cache libc6-compat && mkdir -p /data/prisma
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder /app/apps/web/tsconfig.json ./apps/web/
COPY --from=builder /app/apps/web/src ./apps/web/src
COPY --from=builder /app/apps/web/prisma ./apps/web/prisma
EXPOSE 3000
CMD ["npm","run","start","--prefix","apps/web"]
