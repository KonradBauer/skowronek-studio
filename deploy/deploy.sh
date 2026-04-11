#!/usr/bin/env bash
# =============================================================
# deploy.sh — deploy na VPS (PM2 + system nginx)
# Uruchomienie lokalnie: bash deploy/deploy.sh
#
# Wymagania na VPS (jednorazowy setup — deploy/setup-vps.sh):
#   - Node.js 22, pnpm, PM2, nginx, Docker (tylko dla PostgreSQL)
# =============================================================
set -euo pipefail

# ── KONFIGURACJA ──────────────────────────────────────────────
VPS_HOST="${VPS_HOST:-}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
REMOTE_DIR="/var/www/skowronek-studio"
# ─────────────────────────────────────────────────────────────

[[ -z "$VPS_HOST" ]] && { echo "Ustaw: export VPS_HOST=TWOJ_IP"; exit 1; }

echo "▶ Deploy do $VPS_USER@$VPS_HOST:$VPS_PORT"

# Synchronizuj pliki (bez node_modules, .next, uploads, .env*)
rsync -avz --progress \
    --exclude=node_modules \
    --exclude=.next \
    --exclude=uploads \
    --exclude='.env*' \
    --exclude='.git' \
    -e "ssh -p $VPS_PORT" \
    . "$VPS_USER@$VPS_HOST:$REMOTE_DIR/"

# Zbuduj i uruchom na serwerze
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" bash <<REMOTE
    set -euo pipefail
    cd $REMOTE_DIR

    echo "▶ Uruchamiam PostgreSQL (Docker)..."
    docker compose up -d
    echo "▶ Czekam na gotowość bazy..."
    until docker compose exec -T db pg_isready -U payload -d skowronekstudio; do
        sleep 2
    done

    echo "▶ pnpm install..."
    pnpm install --frozen-lockfile

    echo "▶ pnpm build..."
    NODE_OPTIONS='--max-old-space-size=4096' pnpm build

    echo "▶ PM2 reload / start..."
    pm2 reload ecosystem.config.cjs --update-env 2>/dev/null || pm2 start ecosystem.config.cjs
    pm2 save

    echo "✓ Deploy zakończony"
    pm2 list
REMOTE
