'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTransition } from 'react';
import { changePassword, globalSignOut } from './actions';

export default function SecuritySettingsPage() {
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [isSignOutPending, startSignOutTransition] = useTransition();

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startPasswordTransition(async () => {
      const result = await changePassword(formData);
      if (result?.success) {
        alert('Password updated successfully!');
      } else {
        alert(result?.error || 'An unknown error occurred.');
      }
    });
  };

  const handleSignOut = () => {
    startSignOutTransition(async () => {
      const result = await globalSignOut();
      if (result.success) {
        alert('You have been signed out from all devices.');
      } else {
        alert('An error occurred during global sign-out.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password. Make sure to choose a strong one.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" name="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" />
            </div>
            <Button type="submit" disabled={isPasswordPending}>
              {isPasswordPending ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Global Sign-out</CardTitle>
          <CardDescription>Sign out from all other active sessions on all of your devices.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSignOut} disabled={isSignOutPending}>
            {isSignOutPending ? 'Signing out...' : 'Sign out from all devices'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
