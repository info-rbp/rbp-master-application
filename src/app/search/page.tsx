
import { searchCatalogue } from "@/lib/discovery";
import { SearchFilters } from "./_components/search-filters";
import { SearchResults } from "./_components/search-results";

export default async function SearchPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined }}) {
  const filters = {
    query: typeof searchParams.query === 'string' ? searchParams.query : undefined,
    type: typeof searchParams.type === 'string' ? searchParams.type : undefined,
  };

  const results = await searchCatalogue(filters);

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Search</h1>
      <div className="space-y-8">
        <SearchFilters />
        <SearchResults results={results} />
      </div>
    </div>
  );
}
