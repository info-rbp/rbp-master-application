
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Search, FileDown, FileUp, Filter, Trash2 } from 'lucide-react';
import { MemberListTable } from './components/member-list-table';
import { useReactTable } from '@tanstack/react-table';
import { Member, columns } from './components/columns';
import { members } from './data';
import { MemberFiltersDrawer } from './components/member-filters-drawer';

// Placeholder for the summary metric cards
const SummaryMetrics = () => (
  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-6">
    <div className="border p-4 rounded-lg">
      <h3 className="text-sm font-medium text-muted-foreground">Total Members</h3>
      <p className="text-2xl font-bold">1,234</p>
    </div>
    <div className="border p-4 rounded-lg">
      <h3 className="text-sm font-medium text-muted-foreground">Active</h3>
      <p className="text-2xl font-bold">987</p>
    </div>
    <div className="border p-4 rounded-lg">
      <h3 className="text-sm font-medium text-muted-foreground">Trial</h3>
      <p className="text-2xl font-bold">56</p>
    </div>
    <div className="border p-4 rounded-lg">
      <h3 className="text-sm font-medium text-muted-foreground">Past Due</h3>
      <p className="text-2xl font-bold">23</p>
    </div>
    <div className="border p-4 rounded-lg">
      <h3 className="text-sm font-medium text-muted-foreground">Lapsed</h3>
      <p className="text-2xl font-bold">168</p>
    </div>
    <div className="border p-4 rounded-lg">
      <h3 className="text-sm font-medium text-muted-foreground">VIP</h3>
      <p className="text-2xl font-bold">12</p>
    </div>
  </div>
);

export default function MemberAdministrationPage() {

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Member Administration</h1>
      
      <SummaryMetrics />

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search members..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-1.5" onClick={() => setIsFilterDrawerOpen(true)}>
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Saved Views</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Past Due Members</DropdownMenuItem>
              <DropdownMenuItem>Premium Members</DropdownMenuItem>
              <DropdownMenuItem>Inactive 30+ Days</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="gap-1.5">
            <FileUp className="h-4 w-4" />
            <span>Import</span>
          </Button>
          <Button variant="outline" className="gap-1.5">
            <FileDown className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button variant="destructive" disabled className="gap-1.5">
            <Trash2 className="h-4 w-4" />
            <span>Bulk Actions</span>
          </Button>
          <Button>Create Member</Button>
        </div>
      </div>

      <MemberListTable open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen} />
    </div>
  );
}
