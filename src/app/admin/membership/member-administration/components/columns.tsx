
'use client';

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Badge } from "@/components/ui/badge";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Member = {
  id: string;
  fullName: string;
  email: string;
  company: string;
  membershipTier: string;
  membershipStatus: "Active" | "Trial" | "Past Due" | "Suspended" | "Lapsed" | "VIP";
  joinDate: string;
  renewalDate: string;
  expiryDate: string;
  lastLogin: string;
  paymentStatus: "Paid" | "Failed" | "No Subscription";
  assignedAdmin: string;
  tags: string[];
  source: string;
};


const statusVariantMap: Record<Member["membershipStatus"], "default" | "secondary" | "destructive" | "outline"> = {
    Active: "default",
    Trial: "secondary",
    "Past Due": "destructive",
    Suspended: "destructive",
    Lapsed: "outline",
    VIP: "default",
};


const paymentStatusVariantMap: Record<Member["paymentStatus"], "default" | "secondary" | "destructive"> = {
    Paid: "default",
    Failed: "destructive",
    "No Subscription": "secondary",
};

export const columns: ColumnDef<Member>[] = [
  {
    accessorKey: "id",
    header: "Member ID",
  },
  {
    accessorKey: "fullName",
    header: "Full Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "company",
    header: "Company",
  },
  {
    accessorKey: "membershipTier",
    header: "Membership Tier",
    cell: ({ row }) => {
      const tier = row.getValue("membershipTier") as string;
      return <Badge variant="outline">{tier}</Badge>;
    },
  },
  {
    accessorKey: "membershipStatus",
    header: "Membership Status",
    cell: ({ row }) => {
      const status = row.getValue("membershipStatus") as Member["membershipStatus"];
      return <Badge variant={statusVariantMap[status]}>{status}</Badge>;
    },
  },
  {
    accessorKey: "joinDate",
    header: "Join Date",
  },
  {
    accessorKey: "renewalDate",
    header: "Renewal Date",
  },
  {
    accessorKey: "expiryDate",
    header: "Expiry Date",
  },
  {
    accessorKey: "lastLogin",
    header: "Last Login",
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment Status",
    cell: ({ row }) => {
        const status = row.getValue("paymentStatus") as Member["paymentStatus"];
        return <Badge variant={paymentStatusVariantMap[status]}>{status}</Badge>;
    },
  },
  {
    accessorKey: "assignedAdmin",
    header: "Assigned Admin",
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "source",
    header: "Source",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const member = row.original;
 
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
            <Link href={`/admin/membership/member-administration/${member.id}`} passHref>
                <DropdownMenuItem>View Profile</DropdownMenuItem>
            </Link>
            <DropdownMenuItem>Edit Member</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Change Tier</DropdownMenuItem>
            <DropdownMenuItem>Change Status</DropdownMenuItem>
            <DropdownMenuItem>Extend Expiry</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Add Note</DropdownMenuItem>
            <DropdownMenuItem>Resend Welcome Email</DropdownMenuItem>
            <DropdownMenuItem>Reset Password</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Suspend Member</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Cancel Membership</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
