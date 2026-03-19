import { NextResponse } from 'next/server';
import { getPublicDiscoveryItems, type DiscoveryItem } from '@/lib/discovery';
import { z } from 'zod';

const searchParamsSchema = z.object({
    query: z.string().optional(),
    contentType: z.string().optional(),
    category: z.string().optional(),
});

function calculateScore(item: DiscoveryItem, query: string): number {
    let score = 0;
    const lowerCaseQuery = query.toLowerCase();

    if (item.title.toLowerCase().includes(lowerCaseQuery)) {
        score += 3; // Higher weight for title matches
    }

    if (item.description.toLowerCase().includes(lowerCaseQuery)) {
        score += 2; // Medium weight for description matches
    }

    if (item.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))) {
        score += 1; // Lower weight for tag matches
    }

    return score;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const parsedParams = searchParamsSchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedParams.success) {
        return NextResponse.json({ error: parsedParams.error }, { status: 400 });
    }

    const { query, contentType, category } = parsedParams.data;

    const allItems = await getPublicDiscoveryItems();

    let filteredItems = allItems;

    if (contentType) {
        filteredItems = filteredItems.filter(item => item.contentType === contentType);
    }

    if (category) {
        filteredItems = filteredItems.filter(item => item.category === category);
    }

    if (query) {
        const scoredItems = filteredItems.map(item => ({
            ...item,
            score: calculateScore(item, query),
        }));

        const searchResults = scoredItems
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score);

        return NextResponse.json(searchResults);
    }

    return NextResponse.json(filteredItems);
}
