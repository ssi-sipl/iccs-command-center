# frontend/Dockerfile - Next.js (multi-stage) on Node 22 Alpine
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Install build deps (use package-lock / pnpm lock if present)
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage (fixed)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only package files first (for deterministic install)
COPY --from=builder /app/package*.json ./

# Install production deps as root (so npm can create node_modules)
RUN npm ci --only=production

# Copy built assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Create non-root user and take ownership of /app
RUN addgroup -S app && adduser -S -G app app \
 && chown -R app:app /app

USER app

EXPOSE 3000
CMD ["npm", "start"]
