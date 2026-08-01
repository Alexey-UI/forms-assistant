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

echo "==> CoreDNS: форвард на публичные резолверы вместо резолвера ноды"
# Внутренний DNS-резолвер Yandex Cloud на ноде (/etc/resolv.conf) иногда залипает
# с отрицательным (NXDOMAIN) кэшем на домен, который только что делегировали —
# из-за этого cert-manager не может пройти self-check HTTP-01 challenge.
# Публичные резолверы (8.8.8.8, 77.88.8.8) с той же ноды резолвят корректно.
sudo k3s kubectl get configmap coredns -n kube-system -o jsonpath='{.data.Corefile}' \
  | sed 's#forward \. /etc/resolv\.conf#forward . 8.8.8.8 77.88.8.8#' \
  > /tmp/coredns-corefile.txt
sudo k3s kubectl create configmap coredns -n kube-system \
  --from-file=Corefile=/tmp/coredns-corefile.txt \
  --from-literal=NodeHosts="$(sudo k3s kubectl get configmap coredns -n kube-system -o jsonpath='{.data.NodeHosts}')" \
  --dry-run=client -o yaml | sudo k3s kubectl apply -f -
sudo k3s kubectl -n kube-system rollout restart deployment coredns
sudo k3s kubectl -n kube-system rollout status deployment coredns --timeout=60s
rm -f /tmp/coredns-corefile.txt

echo "==> Готово"
sudo k3s kubectl get nodes -o wide
docker --version
