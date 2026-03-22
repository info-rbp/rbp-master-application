import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PLATFORM_CONTRACT_PRINCIPLES,
  PLATFORM_CONTRACT_V1_ENTITIES,
  PLATFORM_STARTER_ROLE_CODES,
} from '@/lib/platform-contract';

const layers = [
  {
    title: 'Layer 1. Core envelope',
    description: 'Shared identity, tenancy, status, source reference, relationship, audit, and extension fields for every canonical entity.',
  },
  {
    title: 'Layer 2. Canonical entities',
    description: 'Stable platform business objects such as Customer, Application, AccountOrFacility, Task, Notification, and AuditEvent.',
  },
  {
    title: 'Layer 3. Extensions',
    description: 'Lending, finance, operations, HR, and commerce specialisation without polluting the shared contract.',
  },
  {
    title: 'Layer 4. Mapping rules',
    description: 'Explicit adapters from Odoo, Lending, Marble, Chaskiq, and other systems into the canonical layer.',
  },
];

const integrationMappings = [
  { system: 'Odoo', mapsTo: 'Organisation, Customer, ProductOrService, Invoice, Payment, Expense, Subscription, Employee, TicketOrCase, KnowledgeItem' },
  { system: 'Frappe Lending', mapsTo: 'Application, AccountOrFacility / Loan, Payment, repayment extensions, Customer' },
  { system: 'Marble', mapsTo: 'Decision, TicketOrCase, Task, AuditEvent' },
  { system: 'Chaskiq', mapsTo: 'Conversation, Notification, Customer, TicketOrCase' },
  { system: 'Docspell', mapsTo: 'Document' },
  { system: 'EasyAppointments', mapsTo: 'Appointment' },
  { system: 'Metabase', mapsTo: 'Dashboard metadata and analytics references, not operational source-of-truth records' },
  { system: 'Authentik', mapsTo: 'User, Session, role assignment inputs, identity credentials' },
  { system: 'Vaultwarden', mapsTo: 'Platform infrastructure rather than a canonical business entity' },
];

export default function PlatformContractPage() {
  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Platform Contract v1</h1>
        <p className="max-w-4xl text-sm text-muted-foreground">
          The application contract now centers on one canonical platform language that adapters map into. Source systems remain traceable via source references and extensions, but the platform model stays tenant-aware, relationship-first, and stable.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contract principles</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {PLATFORM_CONTRACT_PRINCIPLES.map((principle) => (
                <li key={principle}>{principle}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Universal design rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Use <code>sourceRefs[]</code> instead of first-class vendor IDs.</p>
            <p>Keep source detail in <code>extensions</code> namespaces.</p>
            <p>Use canonical status categories and labels while preserving source nuance.</p>
            <p>Separate identity from business roles, documents from files, and applications from active facilities.</p>
            <p>Prefer relationship edges over giant embedded payloads.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canonical v1 entities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 text-sm text-muted-foreground">
            {PLATFORM_CONTRACT_V1_ENTITIES.map((entity) => (
              <div key={entity} className="rounded-md border p-3">
                {entity}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tenant, workspace, and role model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Every business record resolves to one tenant and optionally one workspace.</p>
            <p>Roles are capability bundles defined by resource, action, scope, and optional conditions.</p>
            <p>The frontend session should arrive fully assembled with active tenant, workspace, permissions, modules, feature flags, and security context.</p>
            <div>
              <p className="mb-2 font-medium text-foreground">Starter role codes</p>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_STARTER_ROLE_CODES.map((role) => (
                  <span key={role} className="rounded-full border px-2 py-1 text-xs">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task, notification, and audit baseline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Task:</strong> open, assign, escalate, complete, request info, and add note across all systems.</p>
            <p><strong className="text-foreground">Notification:</strong> channel-agnostic delivery across in-app, email, sms, push, and chat.</p>
            <p><strong className="text-foreground">Audit:</strong> immutable append-only event history covering platform-originated actions and downstream side effects.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integration mapping guidance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            {integrationMappings.map((item) => (
              <div key={item.system} className="rounded-md border p-3">
                <p className="font-medium text-foreground">{item.system}</p>
                <p>{item.mapsTo}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contract layering</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {layers.map((layer) => (
              <div key={layer.title} className="rounded-md border p-4">
                <p className="font-medium text-foreground">{layer.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{layer.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
