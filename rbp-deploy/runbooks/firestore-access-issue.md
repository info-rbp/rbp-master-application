# Runbook: Firestore access issue

## Symptoms

- control-plane reads/writes failing
- feature controls or analytics endpoints erroring

## Checks

1. Verify Firebase/GCP project mapping for environment.
2. Verify runtime service account IAM role bindings.
3. Verify Firestore API/service health in cloud console.
4. Verify no accidental cross-env project references.

## Remediation

- correct project/service account mapping
- rotate/rebind credentials if needed
- redeploy runtime and verify endpoint recovery
