#!/bin/bash
# deploy.sh — uruchamiaj na VPS: bash deploy.sh
set -e

APP_DIR="/var/www/skowronekstudio"
cd "$APP_DIR"

echo "==> git pull"
git pull origin main

echo "==> pnpm install"
pnpm install --frozen-lockfile

echo "==> pnpm build"
NODE_OPTIONS="--max-old-space-size=4096" pnpm build

echo "==> kopiowanie plików statycznych do standalone"
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

echo "==> pm2 reload / start"
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "==> gotowe"
pm2 status
