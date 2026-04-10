#!/usr/bin/env bash
# =============================================================
# deploy.sh — deploy na VPS
# Uruchomienie lokalnie: bash deploy/deploy.sh
# =============================================================
set -euo pipefail

# ── KONFIGURACJA ──────────────────────────────────────────────
VPS_HOST="${VPS_HOST:-}"          # np. 195.123.45.67
VPS_USER="${VPS_USER:-deploy}"
VPS_PORT="${VPS_PORT:-22}"
REMOTE_DIR="/opt/skowronekstudio"
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

    echo "▶ docker compose up --build -d"
    docker compose up --build -d

    echo "▶ Czyszczenie starych obrazów..."
    docker image prune -f

    echo "✓ Deploy zakończony"
    docker compose ps
REMOTE
