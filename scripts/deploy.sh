#!/usr/bin/env bash
# Ziwa CRM one-shot deploy script.
#
# Usage:
#   SERVER_IP=176.58.124.214 SERVER_USER=root ./scripts/deploy.sh
#
# Requires: ssh + rsync on your local machine, password or key auth set up
# beforehand. Uses your local ssh-agent — run `ssh-copy-id` first to skip
# password prompts.
#
# What this does:
#   1. Installs Docker + compose plugin on the server (idempotent).
#   2. Rsyncs the repo to /opt/ziwa-crm.
#   3. Writes /opt/ziwa-crm/.env if missing (with sane defaults you should edit).
#   4. Builds and starts the docker-compose stack (db + app + seed).
#   5. Prints the URL and login info.

set -euo pipefail

SERVER_IP="${SERVER_IP:?Set SERVER_IP=...}"
SERVER_USER="${SERVER_USER:-root}"
APP_DIR="${APP_DIR:-/opt/ziwa-crm}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new)

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Bootstrapping Docker on $SERVER_USER@$SERVER_IP"
ssh "${SSH_OPTS[@]}" "$SERVER_USER@$SERVER_IP" bash -se <<'BOOTSTRAP'
set -euo pipefail
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
if ! docker compose version >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y docker-compose-plugin
fi
mkdir -p /opt/ziwa-crm
BOOTSTRAP

echo "==> Syncing project to $SERVER_IP:$APP_DIR"
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude .git \
  -e "ssh ${SSH_OPTS[*]}" \
  "$REPO_ROOT/" "$SERVER_USER@$SERVER_IP:$APP_DIR/"

echo "==> Ensuring .env exists on the server"
ssh "${SSH_OPTS[@]}" "$SERVER_USER@$SERVER_IP" bash -se <<BOOTSTRAP_ENV
set -euo pipefail
cd "$APP_DIR"
if [ ! -f .env ]; then
  cat > .env <<'ENVEOF'
POSTGRES_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 48)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
ENVEOF
  echo "Created $APP_DIR/.env (edit to set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)."
fi
BOOTSTRAP_ENV

echo "==> Building & starting stack"
ssh "${SSH_OPTS[@]}" "$SERVER_USER@$SERVER_IP" bash -se <<BOOTSTRAP_UP
set -euo pipefail
cd "$APP_DIR"
docker compose build
docker compose up -d db
# wait for healthy
for i in \$(seq 1 30); do
  status=\$(docker inspect -f '{{.State.Health.Status}}' ziwa-db 2>/dev/null || echo starting)
  [ "\$status" = "healthy" ] && break
  sleep 2
done
docker compose up -d app
docker compose run --rm seed || true
docker compose ps
BOOTSTRAP_UP

cat <<EOF

==> Done.

  App:      http://$SERVER_IP/
  Login:    shady@ziwaland.com / PasswordDefault@Ziwa

Next steps:
  - Point a domain at $SERVER_IP and put a TLS terminator (Caddy/Traefik) in
    front of port 80 if you want HTTPS.
  - Edit $APP_DIR/.env to add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY then re-run
    'docker compose up -d --build app' on the server.
  - Rotate the password you sent in chat: 'passwd' on the server, and update
    the seeded admin user once you log in.

EOF
