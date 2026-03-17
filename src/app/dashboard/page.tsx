
import { marketingHeader } from "@/components/marketing-header";
import { marketingFooter } from "@/components/marketing-footer";

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <marketingHeader />
      <main className="flex-col container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">Dashboard</h1>
      </main>
      <marketingFooter />
    </div>
  );
}
