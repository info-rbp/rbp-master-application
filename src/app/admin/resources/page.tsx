import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getResources, Resource } from './actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

export default async function ResourcesPage() {
  const resources = await getResources();

  return (
    <div className="space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Resources</h2>
        <Button asChild>
            <Link href="/admin/resources/new">Create Resource</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Library</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource: Resource) => (
                <TableRow key={resource.id}>
                  <TableCell>{resource.title}</TableCell>
                  <TableCell>{resource.status}</TableCell>
                  <TableCell>{new Date(resource.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button asChild variant="outline">
                        <Link href={`/admin/resources/${resource.id}`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
