import { getAllDocuments, getSuites } from "@/lib/data";
import DocumentManager from "../components/document-manager";

export default async function AdminDocumentsPage() {
  const initialDocuments = await getAllDocuments();
  const suites = await getSuites();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Document Management</h2>
      </div>
      <DocumentManager initialDocuments={initialDocuments} suites={suites} />
    </div>
  );
}
