
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ToolsPage() {
  return (
    <div className="space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tools</h2>
        <Button>Create Tool</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tool Catalogue</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Placeholder for the tool list */}
          <p>Tool list will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
