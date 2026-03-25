
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";

const reports = [
    { id: 1, name: "Report 1", date: "2023-10-27" },
    { id: 2, name: "Report 2", date: "2023-10-26" },
    { id: 3, name: "Report 3", date: "2023-10-25" },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-col container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">Your Reports</h1>
        <div className="max-w-md mx-auto">
            <ul className="space-y-4">
                {reports.map((report) => (
                    <li key={report.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <span>{report.name}</span>
                        <span className="text-gray-500">{report.date}</span>
                    </li>
                ))}
            </ul>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
