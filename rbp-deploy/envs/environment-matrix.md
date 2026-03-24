# Environment matrix

| Dimension | local | dev | staging | prod |
|---|---|---|---|---|
| Primary purpose | Developer workstation runtime | Shared integration environment | Pre-production release validation | Live customer environment |
| Public app base URL | `http://localhost:3000` | `https://app-dev.<replace-domain>` | `https://app-stg.<replace-domain>` | `https://app.<replace-domain>` |
| Admin surface | `/admin` on localhost | `/admin` on dev app domain | `/admin` on staging app domain | `/admin` on prod app domain |
| Firebase/GCP scope | local emulator / none | dedicated dev projects | dedicated staging projects | dedicated prod projects |
| Firestore target | emulator | `(default)` in dev project | `(default)` in staging project | `(default)` in prod project |
| Data policy | synthetic only | synthetic or masked | masked production-like | live production |
| Feature-flag posture | override-friendly | fast iteration with controls | release-candidate posture | tightly controlled |
| Deploy actors | developer only | service teams + platform SRE | release manager + platform SRE | restricted release authority |
| Mutation policy | local-only | PR + owner review | PR + owner + SRE | PR + owner + SRE (+ security where required) |
| Promotion eligibility | none | to staging | to prod | terminal (rollback only) |
| Seeded users/tenancy | deterministic local seeds | shared integration seeds | release-candidate seeds | minimal required production seeds |

## Notes

- All IDs/domains in this matrix are placeholders until environment onboarding is complete.
- Canonical variable contract per environment is in `./<env>/config-contract.yaml`.
