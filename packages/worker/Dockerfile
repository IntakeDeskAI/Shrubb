FROM node:20-slim AS builder

WORKDIR /app

# Copy workspace config
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/worker/package.json ./packages/worker/

# Install dependencies
RUN npm install --workspace=packages/worker --workspace=packages/shared

# Copy source
COPY packages/shared/ ./packages/shared/
COPY packages/worker/ ./packages/worker/
COPY tsconfig.base.json ./

# Build shared first, then worker
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/worker

# Production image
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/worker/package.json ./packages/worker/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/worker/dist ./packages/worker/dist

CMD ["node", "packages/worker/dist/index.js"]
