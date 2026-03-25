'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState, useTransition } from 'react';
import { createCompany, getCompany, updateCompany } from './actions';

export default function CompanySettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompany().then(company => {
      setCompany(company);
      setLoading(false);
    });
  }, []);

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createCompany(formData);
      if (result.success) {
        alert('Company created successfully!');
        window.location.reload();
      }
    });
  }

  const handleUpdateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateCompany(formData);
      if (result.success) {
        alert('Company updated successfully!');
      }
    });
  };

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company</CardTitle>
        <CardDescription>
          {company ? 'Update your company\'s information.' : 'Create a new company to get started.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {company ? (
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Company Name</Label>
                    <Input id="name" name="name" placeholder="Enter your company's name" defaultValue={company.name} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" name="website" placeholder="Enter your company's website" defaultValue={company.website} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" placeholder="Enter your company's address" defaultValue={company.address} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" placeholder="Enter your company's city" defaultValue={company.city} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="state" placeholder="Enter your company's state" defaultValue={company.state} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="zip">Zip Code</Label>
                    <Input id="zip" name="zip" placeholder="Enter your company's zip code" defaultValue={company.zip} />
                </div>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </form>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input id="name" name="name" placeholder="Enter your company's name" />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Company'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
