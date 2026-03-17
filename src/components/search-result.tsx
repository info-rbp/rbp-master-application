import Link from 'next/link';

export function SearchResult({ result }: { result: any }) {
    return (
        <div className="border rounded-lg p-4">
            <Link href={result.path}>
                <h3 className="text-lg font-semibold hover:underline">{result.title}</h3>
            </Link>
            <p className="text-gray-600">{result.description}</p>
        </div>
    );
}
