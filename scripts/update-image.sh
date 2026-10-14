#!/usr/bin/env bash
set -euo pipefail
: "${IMAGE:?Set IMAGE to the full image URL}"
[[ "$IMAGE" =~ ^[a-zA-Z0-9./:@_-]+$ ]] || { echo 'Invalid IMAGE'; exit 1; }
kubectl -n cloudpoker set image deployment/cloudpoker "app=$IMAGE"
kubectl -n cloudpoker rollout status deployment/cloudpoker --timeout=180s
