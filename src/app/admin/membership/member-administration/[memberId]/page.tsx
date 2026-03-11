'use client'

import React from 'react';
import { members } from '../data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { notFound } from 'next/navigation';
import { ProfileTabs } from './components/profile-tabs';
import { ChangeTierDialog } from './components/dialogs/change-tier-dialog';
import { ChangeStatusDialog } from './components/dialogs/change-status-dialog';
import { ExtendExpiryDialog } from './components/dialogs/extend-expiry-dialog';
import { AddNoteDialog } from './components/dialogs/add-note-dialog';

const MemberProfilePage = ({ params }: { params: { memberId: string } }) => {
  const member = members.find((m) => m.id === params.memberId);
  const [isChangeTierDialogOpen, setIsChangeTierDialogOpen] = React.useState(false);
  const [isChangeStatusDialogOpen, setIsChangeStatusDialogOpen] = React.useState(false);
  const [isExtendExpiryDialogOpen, setIsExtendExpiryDialogOpen] = React.useState(false);
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = React.useState(false);

  if (!member) {
    notFound();
  }

  return (
    <div>
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{member.fullName}</h1>
          <p className="text-muted-foreground">{member.email} - {member.company}</p>
           <div className="flex items-center gap-2 mt-2">
                <Badge>{member.membershipTier}</Badge>
                <Badge variant={member.membershipStatus === 'Active' ? 'default' : 'destructive'}>{member.membershipStatus}</Badge>
                <Badge variant={member.paymentStatus === 'Paid' ? 'default' : 'destructive'}>{member.paymentStatus}</Badge>
            </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsChangeTierDialogOpen(true)}>Change Tier</Button>
          <Button variant="outline" onClick={() => setIsChangeStatusDialogOpen(true)}>Change Status</Button>
          <Button variant="outline" onClick={() => setIsExtendExpiryDialogOpen(true)}>Extend Expiry</Button>
          <Button onClick={() => setIsAddNoteDialogOpen(true)}>Add Note</Button>
        </div>
      </div>
      <Separator className="my-6" />

      <ProfileTabs member={member} />
      <ChangeTierDialog member={member} open={isChangeTierDialogOpen} onOpenChange={setIsChangeTierDialogOpen} />
      <ChangeStatusDialog member={member} open={isChangeStatusDialogOpen} onOpenChange={setIsChangeStatusDialogOpen} />
      <ExtendExpiryDialog member={member} open={isExtendExpiryDialogOpen} onOpenChange={setIsExtendExpiryDialogOpen} />
      <AddNoteDialog member={member} open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen} />
    </div>
  );
};

export default MemberProfilePage;
