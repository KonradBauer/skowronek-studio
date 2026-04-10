#!/usr/bin/env bash
# =============================================================
# setup-vps.sh — jednorazowy setup serwera Skowronek Studio
# Testowane na: Ubuntu 22.04 / Debian 12
# Uruchomienie: sudo bash setup-vps.sh
# =============================================================
set -euo pipefail

# ── KONFIGURACJA ──────────────────────────────────────────────
SSH_PORT=22                    # Zmień jeśli chcesz niestandardowy port
DEPLOY_USER="deploy"           # Użytkownik do deploymentu (nie root)
# ─────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

[[ $EUID -ne 0 ]] && error "Uruchom jako root: sudo bash $0"

# ── 1. AKTUALIZACJA SYSTEMU ───────────────────────────────────
info "Aktualizacja systemu..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git ufw fail2ban unattended-upgrades

# ── 2. AUTOMATYCZNE AKTUALIZACJE BEZPIECZEŃSTWA ──────────────
info "Włączanie automatycznych aktualizacji security..."
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

# ── 3. UŻYTKOWNIK DEPLOY ─────────────────────────────────────
if ! id "$DEPLOY_USER" &>/dev/null; then
    info "Tworzenie użytkownika '$DEPLOY_USER'..."
    useradd -m -s /bin/bash "$DEPLOY_USER"
    usermod -aG sudo "$DEPLOY_USER"
    # Katalog na klucze SSH
    mkdir -p /home/$DEPLOY_USER/.ssh
    chmod 700 /home/$DEPLOY_USER/.ssh
    chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
    warn "WAŻNE: Dodaj swój klucz publiczny do /home/$DEPLOY_USER/.ssh/authorized_keys"
    warn "  cat ~/.ssh/id_ed25519.pub | ssh root@TWOJ_IP 'cat >> /home/$DEPLOY_USER/.ssh/authorized_keys'"
else
    info "Użytkownik '$DEPLOY_USER' już istnieje."
fi

# ── 4. DOCKER ────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    info "Instalacja Docker..."
    curl -fsSL https://get.docker.com | bash
    usermod -aG docker "$DEPLOY_USER"
    systemctl enable --now docker
else
    info "Docker już zainstalowany: $(docker --version)"
fi

# ── 5. HARDENING SSH ─────────────────────────────────────────
info "Hardening SSH (port: $SSH_PORT)..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%Y%m%d)

# Nadpisuj tylko konkretne dyrektywy (bezpieczniejsze niż pełne zastąpienie pliku)
sshd_set() {
    local key=$1 val=$2
    if grep -qE "^#?${key}" /etc/ssh/sshd_config; then
        sed -i "s|^#\?${key}.*|${key} ${val}|" /etc/ssh/sshd_config
    else
        echo "${key} ${val}" >> /etc/ssh/sshd_config
    fi
}

sshd_set "Port"                   "$SSH_PORT"
sshd_set "PermitRootLogin"        "no"
sshd_set "PasswordAuthentication" "no"
sshd_set "PubkeyAuthentication"   "yes"
sshd_set "AuthorizedKeysFile"     ".ssh/authorized_keys"
sshd_set "PermitEmptyPasswords"   "no"
sshd_set "X11Forwarding"          "no"
sshd_set "MaxAuthTries"           "3"
sshd_set "LoginGraceTime"         "30"
sshd_set "ClientAliveInterval"    "300"
sshd_set "ClientAliveCountMax"    "2"
sshd_set "AllowAgentForwarding"   "no"
sshd_set "AllowTcpForwarding"     "no"
sshd_set "Protocol"               "2"

# Walidacja konfiguracji przed restartem
sshd -t || error "Błąd w konfiguracji SSH! Sprawdź /etc/ssh/sshd_config"
systemctl restart ssh
info "SSH zrestartowany."

# ── 6. UFW FIREWALL ──────────────────────────────────────────
info "Konfiguracja UFW..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# SSH
ufw allow "$SSH_PORT/tcp" comment "SSH"

# HTTP i HTTPS (Caddy)
ufw allow 80/tcp  comment "HTTP"
ufw allow 443/tcp comment "HTTPS"
ufw allow 443/udp comment "HTTPS HTTP/3"

# Włącz
ufw --force enable
ufw status verbose
info "UFW skonfigurowany."

# ── 7. FAIL2BAN ──────────────────────────────────────────────
info "Konfiguracja fail2ban..."
cat > /etc/fail2ban/jail.d/skowronek.conf <<EOF
[sshd]
enabled  = true
port     = $SSH_PORT
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 5
bantime  = 1h
findtime = 10m

[caddy-auth]
enabled  = false
# Włącz po skonfigurowaniu logów Caddy w /data/logs/access.log
EOF

systemctl enable --now fail2ban
systemctl restart fail2ban
info "fail2ban uruchomiony."

# ── 8. KATALOGI STORAGE ──────────────────────────────────────
info "Tworzenie katalogów storage..."
mkdir -p /mnt/storage/{uploads/{client-files,gallery,tmp,zips},db}
chown -R $DEPLOY_USER:$DEPLOY_USER /mnt/storage
info "Katalogi gotowe: /mnt/storage/{uploads,db}"

# ── 9. KATALOG PROJEKTU ──────────────────────────────────────
info "Tworzenie katalogu projektu..."
mkdir -p /opt/skowronekstudio
chown $DEPLOY_USER:$DEPLOY_USER /opt/skowronekstudio

# ── PODSUMOWANIE ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Setup zakończony pomyślnie!          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo "Następne kroki:"
echo "  1. Dodaj klucz SSH dla usera '$DEPLOY_USER':"
echo "     cat ~/.ssh/id_ed25519.pub >> /home/$DEPLOY_USER/.ssh/authorized_keys"
echo ""
echo "  2. Przetestuj logowanie kluczem, ZANIM zamkniesz sesję root:"
echo "     ssh $DEPLOY_USER@TWOJ_IP -p $SSH_PORT"
echo ""
echo "  3. Skopiuj projekt na serwer:"
echo "     rsync -avz --exclude=node_modules . $DEPLOY_USER@TWOJ_IP:/opt/skowronekstudio/"
echo ""
echo "  4. Utwórz plik .env.production na serwerze:"
echo "     cp .env.production.example /opt/skowronekstudio/.env.production"
echo "     nano /opt/skowronekstudio/.env.production"
echo ""
echo "  5. Uruchom:"
echo "     cd /opt/skowronekstudio && docker compose up -d --build"
echo ""
warn "Backup konfiguracji SSH: /etc/ssh/sshd_config.bak.$(date +%Y%m%d)"
