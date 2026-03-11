'use client';

import { useEffect, useState } from 'react';
import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type MemberRow = {
  id: string;
  name: string;
  email: string;
  membershipTier: string;
  membershipStatus: string;
};

export default function AdminMembershipMembersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(query(collection(firestore, 'users'), orderBy('email')));
      setMembers(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name ?? '',
            email: data.email ?? '',
            membershipTier: data.membershipTier ?? '',
            membershipStatus: data.membershipStatus ?? 'pending',
          };
        }),
      );
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load members',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMembers();
  }, []);

  const updateLocalMember = (id: string, patch: Partial<MemberRow>) => {
    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, ...patch } : member)));
  };

  const saveMember = async (member: MemberRow) => {
    setSavingId(member.id);
    try {
      await updateDoc(doc(firestore, 'users', member.id), {
        membershipTier: member.membershipTier || null,
        membershipStatus: member.membershipStatus,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'Member updated', description: `${member.email} saved.` });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight">Membership CRM</h1>
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading members...</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="grid gap-3 rounded border p-3 md:grid-cols-5 md:items-center">
                  <div>
                    <p className="font-medium">{member.name || 'Unnamed User'}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <Input
                    value={member.membershipTier}
                    onChange={(e) => updateLocalMember(member.id, { membershipTier: e.target.value })}
                    placeholder="Tier"
                  />
                  <Input
                    value={member.membershipStatus}
                    onChange={(e) => updateLocalMember(member.id, { membershipStatus: e.target.value })}
                    placeholder="Status"
                  />
                  <div className="text-sm text-muted-foreground">{member.email}</div>
                  <Button
                    onClick={() => saveMember(member)}
                    disabled={savingId === member.id}
                    className="md:justify-self-end"
                  >
                    {savingId === member.id ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
