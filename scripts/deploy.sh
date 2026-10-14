#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${IMAGE:?Set IMAGE to the ECR image URL including a unique tag or digest}"
[[ "$IMAGE" =~ ^[a-zA-Z0-9./:@_-]+$ ]] || { echo 'Invalid IMAGE'; exit 1; }
kubectl apply -f deploy/namespace.yaml
sed "s|CLOUDPOKER_IMAGE|$IMAGE|g" deploy/app.yaml | kubectl apply -f -
kubectl apply -f deploy/rbac.yaml
kubectl apply -f deploy/network-policy.yaml
kubectl rollout status deployment/cloudpoker -n cloudpoker --timeout=180s
echo 'Run: kubectl -n cloudpoker port-forward service/cloudpoker 3000:80'
