#!/bin/bash
# setup.sh — jednorazowy setup VPS od zera
# Użycie: bash setup.sh
set -e

REPO="https://github.com/KonradBauer/skowronek-studio.git"
APP_DIR="/var/www/skowronekstudio"
DB_NAME="skowronekstudio"
DB_USER="payload"
NODE_VERSION="22"
PNPM_VERSION="10.28.2"

# ── 1. Node.js ──────────────────────────────────────────────────────────────
echo "==> Node.js $NODE_VERSION"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs

# ── 2. pnpm ─────────────────────────────────────────────────────────────────
echo "==> pnpm $PNPM_VERSION"
corepack enable
corepack prepare pnpm@${PNPM_VERSION} --activate

# ── 3. PM2 ──────────────────────────────────────────────────────────────────
echo "==> PM2"
npm install -g pm2

# ── 4. PostgreSQL ────────────────────────────────────────────────────────────
echo "==> PostgreSQL"
apt-get install -y postgresql postgresql-contrib

echo "==> baza danych: $DB_NAME / user: $DB_USER"
read -rsp "Podaj hasło dla użytkownika PostgreSQL '$DB_USER': " DB_PASS
echo
sudo -u postgres psql <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
  END IF;
END \$\$;
CREATE DATABASE IF NOT EXISTS $DB_NAME OWNER $DB_USER;
SQL
# CREATE DATABASE nie obsługuje IF NOT EXISTS w starszych PG — użyj psql
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" \
  | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# ── 5. nginx ─────────────────────────────────────────────────────────────────
echo "==> nginx"
apt-get install -y nginx

# ── 6. klonowanie repo ───────────────────────────────────────────────────────
echo "==> klonowanie $REPO → $APP_DIR"
mkdir -p /var/www
git clone "$REPO" "$APP_DIR"

# ── 7. nginx config ──────────────────────────────────────────────────────────
echo "==> konfiguracja nginx"
cp "$APP_DIR/nginx.conf" /etc/nginx/sites-available/skowronekstudio
ln -sf /etc/nginx/sites-available/skowronekstudio /etc/nginx/sites-enabled/skowronekstudio
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 8. .env ──────────────────────────────────────────────────────────────────
echo ""
echo "==> konfiguracja .env"
echo "    Uzupełnij poniższe wartości (Enter = zostaw puste):"
echo ""

read -rp "PAYLOAD_SECRET (min 32 znaki): " PAYLOAD_SECRET
read -rp "CRON_SECRET: " CRON_SECRET
read -rp "NEXT_PUBLIC_SITE_URL (np. http://157.173.96.140): " SITE_URL
read -rp "S3_ENDPOINT: " S3_ENDPOINT
read -rp "S3_BUCKET: " S3_BUCKET
read -rp "S3_ACCESS_KEY_ID: " S3_ACCESS_KEY_ID
read -rsp "S3_SECRET_ACCESS_KEY: " S3_SECRET_ACCESS_KEY
echo
read -rp "RESEND_API_KEY (opcjonalne): " RESEND_API_KEY
read -rp "GOOGLE_PLACES_API_KEY (opcjonalne): " GOOGLE_PLACES_API_KEY

cat > "$APP_DIR/.env" <<ENV
DATABASE_URI=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
PAYLOAD_SECRET=${PAYLOAD_SECRET}
CRON_SECRET=${CRON_SECRET}
NEXT_PUBLIC_SITE_URL=${SITE_URL}
NEXT_PUBLIC_SERVER_URL=${SITE_URL}
S3_ENDPOINT=${S3_ENDPOINT}
S3_BUCKET=${S3_BUCKET}
S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID}
S3_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY}
S3_REGION=auto
RESEND_API_KEY=${RESEND_API_KEY}
RESEND_FROM_EMAIL=studio@skowronekstudio.pl
GOOGLE_PLACES_API_KEY=${GOOGLE_PLACES_API_KEY}
ENV

chmod 600 "$APP_DIR/.env"
echo "    .env zapisany"

# ── 9. build + start ─────────────────────────────────────────────────────────
echo "==> deploy (install + build + start)"
bash "$APP_DIR/deploy.sh"

# ── 10. PM2 autostart ────────────────────────────────────────────────────────
echo "==> PM2 autostart przy restarcie systemu"
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash

echo ""
echo "======================================"
echo " Setup zakończony pomyślnie!"
echo " Aplikacja działa pod: ${SITE_URL}"
echo "======================================"
