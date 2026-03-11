
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
import { Input } from '@/components/ui/input';

interface ExtendExpiryDialogProps {
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExtendExpiryDialog({ member, open, onOpenChange }: ExtendExpiryDialogProps) {
  const [expiryDate, setExpiryDate] = React.useState(member.expiryDate);

  const handleExpiryChange = () => {
    // TODO: Implement the actual expiry change logic
    console.log(`Extending expiry for ${member.fullName} to ${expiryDate}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extend Expiry Date</DialogTitle>
          <DialogDescription>
            Select a new expiry date for {member.fullName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="expiryDate" className="text-right">
              Expiry Date
            </Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExpiryChange}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
