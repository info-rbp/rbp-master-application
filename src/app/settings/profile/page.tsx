'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState, useTransition } from 'react';
import { getProfile, updateProfile } from './actions';

export default function ProfileSettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.success) {
        // Handle success, e.g., show a toast notification
        alert('Profile updated successfully!');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your personal information.</CardDescription>
      </CardHeader>
      <CardContent>
        {profile && (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" placeholder="Enter your name" defaultValue={profile.name} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="Enter your email" defaultValue={profile.email} />
                </div>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </form>
        )}
      </CardContent>
    </Card>
  );
}
