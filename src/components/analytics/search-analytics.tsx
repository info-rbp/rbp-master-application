'use client';

import { useEffect } from 'react';
import { useAnalytics } from '@/lib/analytics/event-tracking';
import { EventNames } from '@/lib/analytics/taxonomy';

interface SearchAnalyticsProps {
    query: string;
    resultCount: number;
}

export function SearchAnalytics({ query, resultCount }: SearchAnalyticsProps) {
    const { trackEvent } = useAnalytics();

    useEffect(() => {
        if (query) {
            trackEvent({
                name: EventNames.SEARCH_PERFORMED,
                category: 'product',
                payload: {
                    query,
                    resultCount,
                },
            });
        }
    }, [query, resultCount, trackEvent]);

    return null;
}
