'use client';

import { useTransition } from 'react';
import type { TeamMember } from '@/lib/team';
import { Button } from '@/components/ui/button';
import { removeMemberAction } from '@/app/settings/team/actions';

interface TeamMembersTableProps {
    members: TeamMember[];
}

export function TeamMembersTable({ members }: TeamMembersTableProps) {
    const [isPending, startTransition] = useTransition();

    const handleRemove = (memberId: string) => {
        startTransition(async () => {
            await removeMemberAction(memberId);
        });
    };

    return (
        <div className="bg-white shadow-md rounded my-6">
            <table className="min-w-max w-full table-auto">
                <thead>
                    <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                        <th className="py-3 px-6 text-left">Name</th>
                        <th className="py-3 px-6 text-left">Email</th>
                        <th className="py-3 px-6 text-center">Role</th>
                        <th className="py-3 px-6 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-gray-600 text-sm font-light">
                    {members.map((member) => (
                        <tr key={member.id} className="border-b border-gray-200 hover:bg-gray-100">
                            <td className="py-3 px-6 text-left whitespace-nowrap">{member.name}</td>
                            <td className="py-3 px-6 text-left">{member.email}</td>
                            <td className="py-3 px-6 text-center">{member.role}</td>
                            <td className="py-3 px-6 text-center">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRemove(member.id)}
                                    disabled={isPending}
                                >
                                    {isPending ? 'Removing...' : 'Remove'}
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
