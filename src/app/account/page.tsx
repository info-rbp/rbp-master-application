'use client';

import { FormEvent, useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type ProfileForm = {
  name: string;
  company: string;
  phone: string;
  role: string;
  membershipTier: string;
  membershipStatus: string;
};

export default function AccountPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    company: '',
    phone: '',
    role: '',
    membershipTier: '',
    membershipStatus: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const profileRef = doc(firestore, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setForm({
            name: data.name ?? '',
            company: data.company ?? '',
            phone: data.phone ?? '',
            role: data.role ?? '',
            membershipTier: data.membershipTier ?? '',
            membershipStatus: data.membershipStatus ?? '',
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load account',
          description: error instanceof Error ? error.message : 'Please refresh and try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (!isUserLoading) {
      void loadProfile();
    }
  }, [firestore, user, isUserLoading, toast]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestore, 'users', user.uid), {
        name: form.name,
        company: form.company,
        phone: form.phone,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'Profile updated' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          {loading || isUserLoading ? (
            <p className="text-muted-foreground">Loading profile...</p>
          ) : (
            <form className="grid gap-4" onSubmit={handleSave}>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={form.role} readOnly />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="membershipTier">Membership Tier</Label>
                <Input id="membershipTier" value={form.membershipTier} readOnly />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="membershipStatus">Membership Status</Label>
                <Input id="membershipStatus" value={form.membershipStatus} readOnly />
              </div>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
