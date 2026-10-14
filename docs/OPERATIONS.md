# Operations and reliability exercises

## Basic diagnostics

```bash
kubectl -n cloudpoker get pods -o wide
kubectl -n cloudpoker describe deployment cloudpoker
kubectl -n cloudpoker logs deployment/cloudpoker --tail=50
kubectl -n cloudpoker get events --sort-by=.metadata.creationTimestamp
```

ImagePullBackOff: confirm the image tag exists in the same-region ECR and nodes can reach the registry. CrashLoopBackOff: inspect logs, probes and resources. Pending: inspect node capacity and scheduling events. API timeout: confirm AWS profile, cluster region, and your current public `/32`. Permission denied: distinguish AWS IAM/SSO authentication from Kubernetes RBAC authorization.

## Rollback

Capture the deployment image before each update. Kubernetes retains deployment revisions:

```bash
kubectl -n cloudpoker rollout history deployment/cloudpoker
kubectl -n cloudpoker rollout undo deployment/cloudpoker
kubectl -n cloudpoker rollout status deployment/cloudpoker --timeout=180s
```

Rollback is an administrator action; GitHub's deliberately limited deployer role does not include every diagnostic or rollback permission. Since sessions are in memory, both successful updates and rollbacks lose active sessions.

## Failure drills

| Drill | Action | Expected evidence |
|---|---|---|
| Container restart | Delete the app pod | Deployment creates a replacement; existing game session expires |
| Bad image | Deploy a nonexistent tag, inspect events, then rollback | ImagePullBackOff and recovered healthy pod |
| Resource pressure | Observe metrics during a short controlled local load | CPU/memory request and limit behavior |
| Endpoint outage | Scale app to zero for >2 minutes, then restore to one | Prometheus target-down alert pending/firing then resolves |
| Secrets failure | Start Node with a nonexistent LAB_SECRET_FILE | Process fails rather than claiming readiness |
| Storage recovery | Upload a fictional S3 object twice, retrieve an earlier version | Previous version recovered without overwriting source evidence |

Use only your own private lab. Record the trigger, detection time, recovery time and one improvement. A missing Prometheus target may require an absent-series alert in addition to the provided down-target rule; test both a stopped pod and a deleted ServiceMonitor.

The app has no autoscaling or high availability. Shared durable game state and load testing are prerequisites for safely scaling beyond one replica.
