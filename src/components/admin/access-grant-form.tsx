"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TIER_HIERARCHY } from '@/lib/entitlements/access-grant';
import { grantAccessTier } from '@/lib/admin/actions';

export function AccessGrantForm({ users }: { users: any[] }) {
    const [userId, setUserId] = useState('');
    const [tier, setTier] = useState('');
    const [source, setSource] = useState('');
    const [expiresAt, setExpiresAt] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await grantAccessTier(userId, tier, source, expiresAt ? new Date(expiresAt) : undefined);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Select onValueChange={setUserId}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                    {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.email}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select onValueChange={setTier}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a tier" />
                </SelectTrigger>
                <SelectContent>
                    {Object.keys(TIER_HIERARCHY).map(tier => (
                        <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input placeholder="Source (e.g., promotion)" value={source} onChange={e => setSource(e.target.value)} />
            <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
            <Button type="submit">Grant Access</Button>
        </form>
    );
}
