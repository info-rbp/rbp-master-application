'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import type { DocumentSuite } from '@/lib/definitions';

type ColumnActionsProps = {
  suite: Omit<DocumentSuite, 'documents'>;
  onEdit: (suite: Omit<DocumentSuite, 'documents'>) => void;
  onDelete: (id: string) => void;
};

function ColumnActions({ suite, onEdit, onDelete }: ColumnActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onEdit(suite)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(suite.id)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns = ({ onEdit, onDelete }: { onEdit: (suite: Omit<DocumentSuite, 'documents'>) => void, onDelete: (id: string) => void }): ColumnDef<Omit<DocumentSuite, 'documents'>>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue('name')}</div>;
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => <div className="text-sm text-muted-foreground truncate max-w-xs">{row.getValue('description')}</div>,
  },
  {
    id: 'actions',
    cell: ({ row }) => <ColumnActions suite={row.original} onEdit={onEdit} onDelete={onDelete} />,
  },
];
