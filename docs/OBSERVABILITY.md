# Metrics, dashboards and logs

Install these after the basic AWS app is healthy. The default one-node cluster has limited capacity; inspect allocatable CPU/memory and scale node_count if needed. These optional components add consumption and may require a larger node. Monitoring storage is ephemeral in this lab.

## Prometheus and Grafana

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm search repo prometheus-community/kube-prometheus-stack --versions | head
```

Choose and record a reviewed chart version, then:

```bash
export MONITORING_CHART_VERSION=YOUR_CHOSEN_CHART_VERSION
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack --version "$MONITORING_CHART_VERSION" --namespace monitoring --create-namespace -f observability/monitoring-values.yaml --wait --timeout 10m
kubectl apply -f observability/service-monitor.yaml
kubectl -n monitoring get pods
kubectl -n monitoring port-forward service/monitoring-grafana 3001:80
```

In another private terminal, obtain the generated password:

```bash
kubectl -n monitoring get secret monitoring-grafana -o jsonpath='{.data.admin-password}' | base64 --decode
```

Open http://localhost:3001, log in as `admin`, and select **Dashboards → New → Import** to import `observability/grafana-dashboard.json`. Select the Prometheus datasource when prompted. Do not paste the password into GitHub or chat.

Useful PromQL:

```promql
up{namespace="cloudpoker"}
rate(cloudpoker_requests_total[5m])
rate(cloudpoker_errors_total[5m])
cloudpoker_rounds_total
container_memory_working_set_bytes{namespace="cloudpoker",container="app"}
```

Metrics counters restart with the application. The error counter includes 4xx and 5xx; the dashboard/alert deliberately measures all failed requests. Alert rules appear in Prometheus; delivery to email/Slack/PagerDuty is not configured. Network policy permits monitoring namespace traffic on port 3000. Ensure the CNI network policy addon is healthy before relying on enforcement.

## Optional Splunk log shipping

Use your own Splunk Enterprise/Cloud instance with an enabled HTTPS HEC receiver and token. Splunk is not provisioned here. Create a token scoped to a study index and confirm the correct HEC host/port and certificate trust with your Splunk administrator.

Prepare `.lab/splunk-token`, `.lab/splunk-host`, `.lab/splunk-port` using your editor. The host contains only the DNS hostname, without scheme/path; port is commonly 8088 or 443, depending on the service. Set file permissions to 600. Never commit these files.

```bash
kubectl create namespace logging
kubectl -n logging create secret generic splunk-hec --from-file=token=.lab/splunk-token --from-file=host=.lab/splunk-host --from-file=port=.lab/splunk-port
helm repo add fluent https://fluent.github.io/helm-charts
helm repo update
helm search repo fluent/fluent-bit --versions | head
export FLUENT_BIT_CHART_VERSION=YOUR_REVIEWED_CHART_VERSION
helm upgrade --install logs fluent/fluent-bit --version "$FLUENT_BIT_CHART_VERSION" --namespace logging -f observability/fluent-bit-values.yaml --wait
```

The collector tails only CloudPoker container logs. It needs node log hostPath access; do not apply the application's restricted Pod Security label to the collector namespace without adapting the chart. Logs contain request IDs, allowlisted route names, status and duration; cookies, cards, payloads and secrets are omitted. A collector outage can lose logs because this lab does not configure durable buffering.

Sample Splunk search (adjust index/sourcetype):

```spl
index=YOUR_STUDY_INDEX kubernetes.namespace_name="cloudpoker"
| spath
| stats count avg(durationMs) as average_ms by status
```

Troubleshoot first using `kubectl -n logging logs -l app.kubernetes.io/instance=logs --tail=50`. A private HEC endpoint needs reachable private networking and a trusted CA; never disable TLS verification to make it work.
