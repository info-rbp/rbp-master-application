'use client';

import { useAnalytics } from '@/lib/analytics/event-tracking';

export function AnalyticsProvider() {
    useAnalytics();
    return null;
}
