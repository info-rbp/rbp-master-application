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
import { ArrowUpDown, MoreHorizontal, FileText, Link as LinkIcon } from 'lucide-react';
import type { Document } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type ColumnActionsProps = {
  document: Document;
  onEdit: (doc: Document) => void;
  onDelete: (id: string) => void;
};

function ColumnActions({ document, onEdit, onDelete }: ColumnActionsProps) {
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
        <DropdownMenuItem onClick={() => onEdit(document)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(document.id)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns = ({ onEdit, onDelete }: { onEdit: (doc: Document) => void, onDelete: (id: string) => void }): ColumnDef<Document>[] => [
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
      const type: 'file' | 'drive' = row.original.type;
      const Icon = type === 'drive' ? LinkIcon : FileText;
      return <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue('name')}</span>
      </div>;
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => <div className="text-sm text-muted-foreground truncate max-w-xs">{row.getValue('description')}</div>,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type: 'file' | 'drive' = row.getValue('type');
      return <Badge variant={type === 'drive' ? 'secondary' : 'outline'}>{type}</Badge>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date Added
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const [date, setDate] = React.useState<string | null>(null);

      React.useEffect(() => {
        setDate(format(new Date(row.getValue('createdAt')), 'dd/MM/yyyy'));
      }, [row]);

      return date ? <div>{date}</div> : null;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ColumnActions document={row.original} onEdit={onEdit} onDelete={onDelete} />,
  },
];
