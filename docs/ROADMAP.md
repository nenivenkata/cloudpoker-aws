# Learning roadmap

| Session | Deliverable | Acceptance check |
|---|---|---|
| 1 | Local game, GitHub repo, reviewed Terraform plan | A completed round; tests green; account/region verified |
| 2 | AWS infrastructure and first image | Nodes Ready; app healthy; port-forward works |
| 3 | GitHub OIDC and image pipeline | Scanned image pushed without long-lived AWS keys |
| 4 | Deployment runner and rollback | CI image update and demonstrated rollback |
| 5 | Prometheus/Grafana and failure drill | Dashboard changes with traffic; outage alert fires |
| 6 | Splunk HEC | One request trace found using request ID |
| 7 | Vault secret delivery | Local policy exercise passes, then design durable AWS deployment |
| 8 | PostgreSQL and S3 application integration | Histories survive restart; least-privilege workload identity |
| 9 | Shared game state, login, WebSockets and Hold'em | Authoritative multiplayer rules and reconnection tests |
| 10 | GCP port | Same app image on GKE with GCP-native infrastructure |
| 11 | Azure port | Same app image on AKS with Azure-native infrastructure |

Keep application code, API contract, containers, metrics, dashboards and security tests portable. Replace cloud infrastructure and identity integrations for each cloud. Do not connect all three clouds into one active-active game before persistence, ordering, latency and recovery behavior are understood.

Production hardening exercises: private node subnets, VPC endpoints, dedicated CNI identity, EKS workload identity for S3, remote Terraform state, exact action/image digest pins, persistent observability, alerts to a receiver, production Vault, TLS ingress, rate limiting, authentication, dependency provenance and restore drills.

Optional Ansible host exercise: use your own Ubuntu 24.04 host and SSH key, edit `ansible/inventory.example.ini` into an ignored local inventory, then run `ansible-playbook -i YOUR_PRIVATE_INVENTORY ansible/workstation.yaml`. It installs basic host tools/Docker; AWS CLI, Terraform, kubectl and GitHub runner installation remain separate vendor-guided steps. Never use this playbook on an EKS managed worker.

Useful official references:
- https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html
- https://docs.aws.amazon.com/eks/latest/userguide/cni-network-policy-configure.html
- https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws
- https://developer.hashicorp.com/vault/docs/auth/kubernetes
- https://registry.terraform.io/providers/hashicorp/aws/latest/docs
