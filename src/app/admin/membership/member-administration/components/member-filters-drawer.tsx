
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table } from '@tanstack/react-table';
import { Member } from './columns';

interface MemberFiltersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table<Member>;
}

export function MemberFiltersDrawer({
  open,
  onOpenChange,
  table,
}: MemberFiltersDrawerProps) {

  const handleFilterChange = (columnId: string, value: any) => {
    table.getColumn(columnId)?.setFilterValue(value === 'all' ? null : value);
  };
  
  const handleReset = () => {
    table.resetColumnFilters();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Filter Members</SheetTitle>
          <SheetDescription>
            Refine your member list using the filters below.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="membershipTier" className="text-right">
              Tier
            </Label>
            <Select
              onValueChange={(value) => handleFilterChange('membershipTier', value)}
              defaultValue={table.getColumn('membershipTier')?.getFilterValue() as string || 'all'}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Basic">Basic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="membershipStatus" className="text-right">
              Status
            </Label>
            <Select
              onValueChange={(value) => handleFilterChange('membershipStatus', value)}
              defaultValue={table.getColumn('membershipStatus')?.getFilterValue() as string || 'all'}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Trial">Trial</SelectItem>
                <SelectItem value="Past Due">Past Due</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Lapsed">Lapsed</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentStatus" className="text-right">
              Payment
            </Label>
            <Select
              onValueChange={(value) => handleFilterChange('paymentStatus', value)}
               defaultValue={table.getColumn('paymentStatus')?.getFilterValue() as string || 'all'}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
                <SelectItem value="No Subscription">No Subscription</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter>
            <Button variant="outline" onClick={handleReset}>Reset</Button>
            <SheetClose asChild>
                <Button>Apply Filters</Button>
            </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
