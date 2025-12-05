FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build-time args and expose them as env vars for next build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG SUPABASE_SERVICE_ROLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Automatically leverage output traces to reduce image size
# Standalone output includes everything: server.js, node_modules, and public folder (if exists)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files (required for static assets)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure public directory exists (standalone may have created it, but ensure it's there)
RUN mkdir -p ./public || true

# Set the correct permission for prerender cache
RUN mkdir -p .next
RUN chown -R nextjs:nodejs .next ./public

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
