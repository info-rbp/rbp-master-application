import DocushareTypeManager from '@/app/admin/components/docushare-type-manager';
import { getSuites } from '@/lib/data';

export default async function AdminDocusharePage() {
  const suites = await getSuites();
  return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6"><h2 className="text-3xl font-bold tracking-tight">templates</h2><DocushareTypeManager initial={suites} type="templates" /></div>;
}
