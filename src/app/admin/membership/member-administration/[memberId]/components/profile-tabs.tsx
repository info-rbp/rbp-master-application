
'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Member } from '../../components/columns';
import { OverviewTab } from './overview-tab';

interface ProfileTabsProps {
  member: Member;
}

export function ProfileTabs({ member }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="membership">Membership Details</TabsTrigger>
        <TabsTrigger value="access">Access & Permissions</TabsTrigger>
        <TabsTrigger value="billing">Billing & Invoices</TabsTrigger>
        <TabsTrigger value="activity">Activity Log</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <OverviewTab member={member} />
      </TabsContent>
      <TabsContent value="membership">
        <p>Membership details content will go here.</p>
      </TabsContent>
        <TabsContent value="access">
            <p>Access and permissions content will go here.</p>
        </TabsContent>
        <TabsContent value="billing">
            <p>Billing and invoices content will go here.</p>
        </TabsContent>
        <TabsContent value="activity">
            <p>Activity log content will go here.</p>
        </TabsContent>
        <TabsContent value="notes">
            <p>Notes content will go here.</p>
        </TabsContent>
    </Tabs>
  );
}
