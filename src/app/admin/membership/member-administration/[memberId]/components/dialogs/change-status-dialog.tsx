
'use client';

import React from 'react';
import { Member } from '../../../components/columns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChangeStatusDialogProps {
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeStatusDialog({ member, open, onOpenChange }: ChangeStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = React.useState(member.membershipStatus);

  const handleStatusChange = () => {
    // TODO: Implement the actual status change logic
    console.log(`Changing status for ${member.fullName} to ${selectedStatus}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Membership Status</DialogTitle>
          <DialogDescription>
            Select a new membership status for {member.fullName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Trial">Trial</SelectItem>
                <SelectItem value="Past Due">Past Due</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Lapsed">Lapsed</SelectItem>
                 <SelectItem value="VIP">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleStatusChange}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
