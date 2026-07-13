# Base image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy lockfiles and workspace configs
COPY package.json package-lock.json tsconfig.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm ci

# Copy sources
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build shared package and api
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api

# Runtime image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma && node apps/api/dist/index.js"]
