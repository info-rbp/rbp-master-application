'use client';

import { useFormState } from 'react-dom';
import { inviteMemberAction } from '@/app/settings/team/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function InviteMemberForm() {
    const [state, formAction] = useFormState(inviteMemberAction, { success: false, error: null });

    return (
        <form action={formAction} className="flex items-end gap-4 p-4 border rounded-lg">
            <div className="flex-grow">
                <Label htmlFor="email">Email</Label>
                <Input type="email" id="email" name="email" placeholder="member@example.com" required />
            </div>
            <div>
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="member">
                    <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit">Invite</Button>
            {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
            {state.success && <p className="text-green-500 text-sm">Invitation sent!</p>}
        </form>
    );
}
