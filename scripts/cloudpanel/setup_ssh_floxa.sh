#!/usr/bin/env bash
# ==============================================================================
# FLOXA WORK — SAFE SSH SETUP FOR USER 'floxa'
# Target Server: Hostinger Ubuntu VPS (89.116.121.25)
# Environment: Multi-tenant CloudPanel VPS
# Scope: Strictly isolates user 'floxa' SSH keys without modifying /etc/ssh/sshd_config
# ==============================================================================

set -euo pipefail

echo "===================================================================="
echo "  FLOXA WORK — SAFE SSH KEY SETUP (ZERO DISRUPTION TO OTHER USERS)"
echo "===================================================================="

DEPLOY_USER="floxa"
USER_HOME="/home/${DEPLOY_USER}"
SSH_DIR="${USER_HOME}/.ssh"
AUTH_KEYS="${SSH_DIR}/authorized_keys"

# 1. Ensure user exists with a valid login shell
if ! id "${DEPLOY_USER}" &>/dev/null; then
    echo "[1/3] Creating user '${DEPLOY_USER}' with isolated home directory..."
    useradd -m -d "${USER_HOME}" -s /bin/bash "${DEPLOY_USER}"
else
    echo "[1/3] Verified existing user '${DEPLOY_USER}'."
    # Ensure shell is /bin/bash
    usermod -s /bin/bash "${DEPLOY_USER}"
fi

# 2. Setup isolated .ssh directory with strict permissions
echo "[2/3] Setting up ~/.ssh with strict permissions (700 / 600)..."
mkdir -p "${SSH_DIR}"
touch "${AUTH_KEYS}"

# 3. Add SSH public key if supplied as an argument
if [ $# -ge 1 ] && [ -n "$1" ]; then
    PUBLIC_KEY="$1"
    if grep -qF "${PUBLIC_KEY}" "${AUTH_KEYS}"; then
        echo "Public key is already present in ${AUTH_KEYS}."
    else
        echo "${PUBLIC_KEY}" >> "${AUTH_KEYS}"
        echo "Successfully added public key to ${AUTH_KEYS}."
    fi
else
    echo ""
    echo "  [NOTICE] No SSH key passed as argument."
    echo "  To add an SSH public key, either:"
    echo "    a) Run: bash setup_ssh_floxa.sh \"ssh-ed25519 AAAA... your_comment\""
    echo "    b) Or in CloudPanel UI: Go to Users > floxa > SSH Keys > Add Public Key"
    echo "    c) Or paste directly into: ${AUTH_KEYS}"
    echo ""
fi

# Ensure strict POSIX ownership and permissions
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${SSH_DIR}"
chmod 700 "${SSH_DIR}"
chmod 600 "${AUTH_KEYS}"

echo "[3/3] SSH setup completed safely for user '${DEPLOY_USER}'."
echo "===================================================================="
echo "  SAFETY CONFIRMATION:"
echo "  - /etc/ssh/sshd_config was NOT touched."
echo "  - Default SSH port (22) was NOT changed."
echo "  - UFW / Firewall was NOT altered."
echo "  - Existing users' SSH access was NOT affected in any way."
echo ""
echo "  Connect command from your client machine:"
echo "  ssh ${DEPLOY_USER}@89.116.121.25"
echo "===================================================================="
