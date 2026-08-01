#!/usr/bin/env bash
# Готовит свежую Ubuntu 24.04 VM: Docker + k3s (single-node Kubernetes).
# Идемпотентен — можно перезапускать безопасно.
set -euo pipefail

echo "==> apt update"
sudo apt-get update -y

echo "==> Docker"
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
else
  echo "docker уже установлен: $(docker --version)"
fi

echo "==> k3s"
: "${K3S_TLS_SAN:?Задайте K3S_TLS_SAN=<внешний IP или домен>}"
if ! command -v k3s &>/dev/null; then
  curl -sfL https://get.k3s.io | sudo INSTALL_K3S_EXEC="--write-kubeconfig-mode=644 --tls-san=${K3S_TLS_SAN}" sh -
else
  echo "k3s уже установлен: $(k3s --version | head -1)"
fi

echo "==> Ожидание готовности ноды"
for i in $(seq 1 30); do
  if sudo k3s kubectl get nodes 2>/dev/null | grep -q " Ready "; then
    break
  fi
  sleep 2
done

echo "==> Готово"
sudo k3s kubectl get nodes -o wide
docker --version
