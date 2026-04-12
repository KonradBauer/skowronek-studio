#!/usr/bin/env bash
# =============================================================
# deploy.sh — deploy na VPS przez git clone/pull + Docker
# Uruchomienie: bash deploy/deploy.sh
#
# Wymagania na VPS (jednorazowy setup):
#   - Docker + Docker Compose plugin
#   - Git
#   - Plik .env w REMOTE_DIR (patrz .env.production.example)
#
# Pierwsze uruchomienie na świeżym serwerze:
#   1. bash deploy/deploy.sh  — sklonuje repo i wyświetli instrukcję .env
#   2. Utwórz .env na VPS (patrz niżej)
#   3. bash deploy/deploy.sh  — zbuduje i uruchomi stack
# =============================================================
set -euo pipefail

REPO_URL="https://github.com/KonradBauer/skowronek-studio.git"
VPS_HOST="${VPS_HOST:-}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
REMOTE_DIR="/var/www/skowronekstudio"
BRANCH="${BRANCH:-main}"

[[ -z "$VPS_HOST" ]] && { echo "Ustaw: export VPS_HOST=TWOJ_IP"; exit 1; }

echo "▶ Deploy do $VPS_USER@$VPS_HOST:$VPS_PORT → $REMOTE_DIR"

ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" bash <<REMOTE
    set -euo pipefail

    # ── Clone lub pull ─────────────────────────────────────
    if [ -d "$REMOTE_DIR/.git" ]; then
        echo "▶ git pull ($BRANCH)..."
        cd $REMOTE_DIR
        git fetch origin
        git reset --hard origin/$BRANCH
    else
        echo "▶ git clone..."
        mkdir -p $REMOTE_DIR
        git clone --branch $BRANCH $REPO_URL $REMOTE_DIR
        cd $REMOTE_DIR
    fi

    # ── Sprawdź czy .env istnieje ──────────────────────────
    if [ ! -f "$REMOTE_DIR/.env" ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  BRAKUJE PLIKU .env — stack nie zostanie uruchomiony"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Utwórz plik .env na VPS:"
        echo "  nano $REMOTE_DIR/.env"
        echo ""
        echo "Wzór znajdziesz w repozytorium:"
        echo "  $REMOTE_DIR/.env.production.example"
        echo ""
        exit 1
    fi

    # ── Docker compose up ──────────────────────────────────
    echo "▶ docker compose up --build..."
    docker compose up -d --build

    echo "▶ Czekam aż app będzie gotowy..."
    sleep 5
    docker compose ps

    echo "▶ Logi app (ostatnie 30 linii):"
    docker compose logs app --tail=30

    echo ""
    echo "✓ Deploy zakończony"
REMOTE
