FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# ------- Dependencies -------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ------- Migrator (bez next build — tylko do payload migrate) -------
FROM base AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ------- Builder -------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args for Next.js public env vars (baked at build time)
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SERVER_URL

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL

RUN pnpm build

# ------- Runner -------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Allow larger files in memory (up to 4GB for assembling uploads)
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Uploads directory structure (local storage)
RUN mkdir -p /app/uploads/client-files /app/uploads/gallery /app/uploads/media /app/uploads/tmp /app/uploads/zips && \
    chown -R nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
