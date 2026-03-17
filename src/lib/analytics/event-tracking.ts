'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function useAnalytics() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const url = `${pathname}?${searchParams}`;
        // In a real application, you would send this to your analytics service
        console.log(`Page view: ${url}`);
    }, [pathname, searchParams]);
}

export async function trackEvent(eventName: string, eventData: Record<string, any>) {
    // In a real application, you would send this to your analytics service
    console.log(`Event: ${eventName}`, eventData);
    
    // Example of sending to an API endpoint
    /*
    await fetch('/api/analytics', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventName, eventData }),
    });
    */
}
