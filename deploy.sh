#!/usr/bin/env bash
# Deploy do Site Tessera pro VPS Hostinger.
# Uso:
#   ./deploy.sh          # Sincroniza a pasta public/ com /var/www/salto/tessera (ou /var/www/tessera)
#   ./deploy.sh prod     # Sincroniza para /var/www/tessera (domínio próprio tessera.com.br)
#   ./deploy.sh salto    # Sincroniza para /var/www/salto/tessera (homologação em salto.solutions/tessera)
set -euo pipefail

VPS_HOST="deploy@187.127.39.132"
SSH_KEY="$HOME/.ssh/id_ed25519"
TARGET_DIR="/var/www/salto/tessera"

if [ "${1:-}" = "prod" ]; then
  TARGET_DIR="/var/www/tessera"
fi

echo "==> Enviando site Tessera para $VPS_HOST:$TARGET_DIR..."

ssh -i "$SSH_KEY" "$VPS_HOST" "mkdir -p $TARGET_DIR"

rsync -avz --delete \
  -e "ssh -i $SSH_KEY" \
  public/ "$VPS_HOST:$TARGET_DIR/"

echo "==> Deploy concluído com sucesso!"
