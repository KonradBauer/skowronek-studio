#!/bin/bash
# Setup cron jobs for both sites
# Run once after deployment: bash scripts/setup-cron.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Load env vars
source "$SCRIPT_DIR/.env"

# Add cron jobs (3:00 AM for site1, 3:15 AM for site2)
# Uses docker exec to reach the internal network
(crontab -l 2>/dev/null || true; cat <<EOF
# Skowronek Studio - cleanup expired clients
0 3 * * * docker exec skowronekstudio-site1-1 wget -q -O /dev/null --header="Authorization: Bearer ${SITE1_CRON_SECRET}" --post-data="" http://localhost:3000/api/cron/cleanup
# Rezonans Studio - cleanup expired clients
15 3 * * * docker exec skowronekstudio-site2-1 wget -q -O /dev/null --header="Authorization: Bearer ${SITE2_CRON_SECRET}" --post-data="" http://localhost:3000/api/cron/cleanup
EOF
) | crontab -

echo "Cron jobs configured:"
crontab -l
