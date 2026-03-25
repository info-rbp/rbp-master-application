
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";

const resources = [
    { id: 1, name: "Template 1", url: "/template1.zip" },
    { id: 2, name: "Companion Guide 1", url: "/guide1.pdf" },
    { id: 3, name: "Documentation Suite 1", url: "/docs1.zip" },
];

export default function ResourcesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-col container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">Resources</h1>
        <div className="max-w-md mx-auto">
            <ul className="space-y-4">
                {resources.map((resource) => (
                    <li key={resource.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <span>{resource.name}</span>
                        <a href={resource.url} download className="text-blue-500 hover:underline">Download</a>
                    </li>
                ))}
            </ul>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
