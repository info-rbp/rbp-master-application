'use client';

import { useMemo, useTransition } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlatformSession } from '@/app/providers/platform-session-provider';

export function TenantSwitcher() {
  const { session, switchTenant } = usePlatformSession();
  const [isPending, startTransition] = useTransition();

  const tenants = useMemo(() => session?.availableTenants ?? [], [session]);

  if (!session || tenants.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Tenant</p>
      <Select
        defaultValue={session.activeTenant.id}
        onValueChange={(tenantId) => {
          startTransition(() => {
            void switchTenant(tenantId);
          });
        }}
      >
        <SelectTrigger aria-label="Select tenant" disabled={isPending}>
          <SelectValue placeholder="Select tenant" />
        </SelectTrigger>
        <SelectContent>
          {tenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              {tenant.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
