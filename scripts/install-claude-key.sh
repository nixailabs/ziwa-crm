#!/usr/bin/env bash
# Install a dedicated SSH public key on the server so Claude (or CI) can
# operate without a password. Run from your laptop AFTER deploy.sh.
#
# Usage:
#   SERVER_IP=176.58.124.214 SERVER_USER=root ./scripts/install-claude-key.sh /path/to/claude.pub

set -euo pipefail

SERVER_IP="${SERVER_IP:?Set SERVER_IP=...}"
SERVER_USER="${SERVER_USER:-root}"
PUBKEY_FILE="${1:?Usage: install-claude-key.sh /path/to/key.pub}"

if [ ! -f "$PUBKEY_FILE" ]; then
  echo "Pubkey not found: $PUBKEY_FILE" >&2
  exit 1
fi

ssh -o StrictHostKeyChecking=accept-new "$SERVER_USER@$SERVER_IP" \
  "mkdir -p ~/.ssh && chmod 700 ~/.ssh && touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys" \
  < /dev/null

cat "$PUBKEY_FILE" | ssh "$SERVER_USER@$SERVER_IP" \
  "grep -qxFf - ~/.ssh/authorized_keys || cat >> ~/.ssh/authorized_keys"

echo "Installed $(basename "$PUBKEY_FILE") to $SERVER_USER@$SERVER_IP:~/.ssh/authorized_keys"
