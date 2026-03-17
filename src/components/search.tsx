import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchResult } from '@/components/search-result';

export function Search() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    const handleSearch = async () => {
        const response = await fetch(`/api/discovery?query=${query}`);
        const data = await response.json();
        setResults(data);
    };

    return (
        <div>
            <div className="flex space-x-2">
                <Input
                    type="text"
                    placeholder="Search..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
                <Button onClick={handleSearch}>Search</Button>
            </div>
            <div className="mt-4 space-y-4">
                {results.map(result => (
                    <SearchResult key={result.id} result={result} />
                ))}
            </div>
        </div>
    );
}
