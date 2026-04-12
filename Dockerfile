FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# ------- Dependencies -------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

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

# Payload needs these at build time for config initialization (not actual DB connection)
ENV PAYLOAD_SECRET=build-time-secret-not-used-at-runtime
ENV DATABASE_URI=postgresql://fake:fake@localhost:5432/fake

RUN pnpm build

# ------- Migrate (schema push) -------
FROM base AS migrate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
CMD ["pnpm", "exec", "tsx", "migrate.ts"]

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
