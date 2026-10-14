# Cost and cleanup

This EKS project is not a free-tier guarantee. AWS lists standard-support EKS control-plane charges separately from EC2, EBS, public IPv4, logging and storage. At $0.10 per cluster-hour, the control plane alone is approximately $73 for 730 hours; worker nodes and supporting resources are additional. Verify current regional prices in the AWS Pricing Calculator before apply. Budget notifications do not automatically stop charges.

Official references:
- https://aws.amazon.com/eks/pricing/
- https://calculator.aws/
- https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html

The default is one t3.large on-demand worker with a 30 GiB encrypted gp3 volume. Additional monitoring can require more capacity. Public IPv4, T3 surplus CPU credits, data transfer, S3 versions, ECR images and CloudWatch ingestion/storage can add costs. No NAT gateway or public load balancer is created.

EKS control planes cannot simply be stopped overnight. Scaling nodes down does not remove control-plane charges. For occasional study, destroy and recreate the lab after preserving required evidence/state.

## Teardown checklist

1. Stop local port-forwards and any self-hosted runner jobs.
2. If installed, remove optional Helm releases while the cluster still exists:

```bash
helm uninstall logs -n logging
helm uninstall monitoring -n monitoring
kubectl delete namespace cloudpoker
```

Skip releases that were not installed. These examples remove ephemeral study data. Inspect PVCs, Services, load balancers and any externally created resources first; this lab's defaults do not create public load balancers or persistent monitoring disks.

3. The S3 bucket and ECR repo refuse deletion while nonempty. If they contain useful evidence, download it and decide whether to retain those resources. To empty them, use AWS console actions specifically on this lab's bucket/repository. S3 **versions and delete markers** must also be removed; `aws s3 rm --recursive` alone is insufficient for versioned buckets. Delete the image contents from the lab ECR repository. Do not change `force_destroy` or `force_delete` casually.
4. From the same checkout/state and AWS identity:

```bash
terraform -chdir=infra/aws plan -destroy -out=tfplan-destroy
terraform -chdir=infra/aws show tfplan-destroy
terraform -chdir=infra/aws apply tfplan-destroy
```

Read the plan carefully: it removes this lab. Do not delete an existing account-wide OIDC provider that was passed by ARN; Terraform does not own that provider. A provider created by this stack will be removed, so ensure another project has not begun using it before destroying.
5. Verify the cluster, node instances, EBS volumes, ECR repo, S3 bucket and CloudWatch log group are gone. Check billing later for delayed metering and any manually created resources. Remove optional runner registration and unrelated host infrastructure separately.
6. Stop local services with `docker compose down`; clean up the separate Vault exercise per VAULT.md.
