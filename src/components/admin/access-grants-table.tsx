import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { revokeAccessGrant } from '@/lib/admin/actions';

export function AccessGrantsTable({ users, grants }: { users: any[], grants: Record<string, any[]> }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map(user => (
                    grants[user.id]?.map(grant => (
                        <TableRow key={grant.id}>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{grant.tier}</TableCell>
                            <TableCell>{grant.source}</TableCell>
                            <TableCell>{grant.expiresAt?.toDate().toLocaleDateString()}</TableCell>
                            <TableCell>
                                <Button variant="destructive" onClick={() => revokeAccessGrant(user.id, grant.id)}>
                                    Revoke
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                ))}
            </TableBody>
        </Table>
    );
}
