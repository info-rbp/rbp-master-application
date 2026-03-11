import { getSuites } from "@/lib/data";
import SuiteManager from "../../components/suite-manager";

export default async function AdminDocumentationSuitesPage() {
  const suites = await getSuites();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Documentation Suite Management</h2>
      </div>
      <SuiteManager initialSuites={suites} />
    </div>
  );
}
