
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

interface ChangeTierDialogProps {
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeTierDialog({ member, open, onOpenChange }: ChangeTierDialogProps) {
  const [selectedTier, setSelectedTier] = React.useState(member.membershipTier);

  const handleTierChange = () => {
    // TODO: Implement the actual tier change logic
    console.log(`Changing tier for ${member.fullName} to ${selectedTier}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Membership Tier</DialogTitle>
          <DialogDescription>
            Select a new membership tier for {member.fullName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tier" className="text-right">
              Tier
            </Label>
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Basic">Basic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleTierChange}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
