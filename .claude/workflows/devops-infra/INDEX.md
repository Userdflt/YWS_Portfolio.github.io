# Devops Infra

Container, Kubernetes, Nginx, and Terraform configuration and optimization.

| Pack | Description | Path |
|---|---|---|
| `dockerfile-optimizer` | Optimizes Dockerfiles for smaller images, faster builds, better caching, and security hardening using multi-stage builds and best practices. Use when users request "optimize Dockerfile", "reduce Docker image size", "Docker best practices", or "containerize application". | `.claude/workflows/devops-infra/dockerfile-optimizer/RULE.md` |
| `kubernetes-manifest-generator` | Generates Kubernetes manifests including Deployments, Services, ConfigMaps, Secrets, Ingress, and HPA with best practices. Use when users request "Kubernetes setup", "K8s manifests", "deploy to Kubernetes", "container orchestration", or "K8s configuration". | `.claude/workflows/devops-infra/kubernetes-manifest-generator/RULE.md` |
| `nginx-config-optimizer` | Optimizes Nginx configurations for performance, security, caching, and load balancing with modern best practices. Use when users request "Nginx setup", "reverse proxy", "load balancer", "web server config", or "Nginx optimization". | `.claude/workflows/devops-infra/nginx-config-optimizer/RULE.md` |
| `terraform-module-builder` | Creates reusable Terraform modules with proper structure, variables, outputs, and state management for infrastructure as code. Use when users request "Terraform setup", "infrastructure as code", "IaC module", "cloud provisioning", or "Terraform module". | `.claude/workflows/devops-infra/terraform-module-builder/RULE.md` |

---

Tier-1 catalog: `.claude/workflows/catalog.md`. Tier-0 discovery rule: `.claude/rules/workflow-discovery.md`.
