#!/bin/bash
# Setup cron job for Skowronek Studio
# Run once after deployment: bash scripts/setup-cron.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Load env vars
source "$SCRIPT_DIR/.env"

# Add cron job (3:00 AM)
(crontab -l 2>/dev/null || true; cat <<EOF
# Skowronek Studio - cleanup expired clients
0 3 * * * docker exec skowronekstudio-site-1 wget -q -O /dev/null --header="Authorization: Bearer ${CRON_SECRET}" --post-data="" http://localhost:3000/api/cron/cleanup
EOF
) | crontab -

echo "Cron jobs configured:"
crontab -l
