#!/usr/bin/env bash
# Идемпотентно создаёт k8s-секреты для namespace forms-assistant.
# Если секрет уже существует — переиспользует значения (чтобы не сломать
# уже работающий Postgres сменой пароля). Требует KUBECONFIG и наличия
# infra/terraform/secrets/ci-sa-key.json (создаётся Terraform'ом).
set -euo pipefail

NAMESPACE="forms-assistant"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CI_KEY_FILE="$SCRIPT_DIR/../terraform/secrets/ci-sa-key.json"

kubectl get namespace "$NAMESPACE" >/dev/null 2>&1 || kubectl create namespace "$NAMESPACE"

existing_value() {
  # $1 = secret name, $2 = key
  kubectl -n "$NAMESPACE" get secret "$1" -o "jsonpath={.data.$2}" 2>/dev/null | base64 -d 2>/dev/null || true
}

PG_PASSWORD="$(existing_value postgres-secrets POSTGRES_PASSWORD)"
if [ -z "$PG_PASSWORD" ]; then
  PG_PASSWORD="$(openssl rand -hex 20)"
fi

JWT_ACCESS_SECRET="$(existing_value backend-secrets JWT_ACCESS_SECRET)"
[ -z "$JWT_ACCESS_SECRET" ] && JWT_ACCESS_SECRET="$(openssl rand -hex 32)"

JWT_REFRESH_SECRET="$(existing_value backend-secrets JWT_REFRESH_SECRET)"
[ -z "$JWT_REFRESH_SECRET" ] && JWT_REFRESH_SECRET="$(openssl rand -hex 32)"

ANON_SECRET="$(existing_value backend-secrets ANONYMOUS_TOKEN_SECRET)"
[ -z "$ANON_SECRET" ] && ANON_SECRET="$(openssl rand -hex 32)"

DATABASE_URL="postgresql://forms:${PG_PASSWORD}@postgres:5432/forms_assistant?schema=public"

kubectl -n "$NAMESPACE" create secret generic postgres-secrets \
  --from-literal=POSTGRES_USER=forms \
  --from-literal=POSTGRES_PASSWORD="$PG_PASSWORD" \
  --from-literal=POSTGRES_DB=forms_assistant \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl -n "$NAMESPACE" create secret generic backend-secrets \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET" \
  --from-literal=JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
  --from-literal=ANONYMOUS_TOKEN_SECRET="$ANON_SECRET" \
  --dry-run=client -o yaml | kubectl apply -f -

if [ -f "$CI_KEY_FILE" ]; then
  kubectl -n "$NAMESPACE" create secret docker-registry ycr-pull-secret \
    --docker-server=cr.yandex \
    --docker-username=json_key \
    --docker-password="$(cat "$CI_KEY_FILE")" \
    --dry-run=client -o yaml | kubectl apply -f -
else
  echo "ВНИМАНИЕ: $CI_KEY_FILE не найден, ycr-pull-secret не создан" >&2
fi

echo "Секреты в namespace $NAMESPACE обновлены (значения не выводятся)."
