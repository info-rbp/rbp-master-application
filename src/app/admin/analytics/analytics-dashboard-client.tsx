'use client';

import { useMemo } from 'react';
import type { AnalyticsEvent } from '@/lib/analytics/taxonomy';

type AnalyticsDashboardClientProps = {
  events: AnalyticsEvent[];
};

export default function AnalyticsDashboardClient({ events }: AnalyticsDashboardClientProps) {
  const formattedEvents = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        formattedTimestamp: event.timestamp ? new Date(event.timestamp).toLocaleString() : 'N/A',
      })),
    [events],
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Platform Analytics Events</h1>
      <div className="my-6 rounded bg-white shadow-md">
        <table className="min-w-max w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-sm uppercase leading-normal text-gray-600">
              <th className="px-6 py-3 text-left">Timestamp</th>
              <th className="px-6 py-3 text-left">Event Name</th>
              <th className="px-6 py-3 text-left">Category</th>
              <th className="px-6 py-3 text-left">Payload</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light text-gray-600">
            {formattedEvents.map((event, index) => (
              <tr key={`${event.name}-${event.timestamp ?? index}-${index}`} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="whitespace-nowrap px-6 py-3 text-left">{event.formattedTimestamp}</td>
                <td className="px-6 py-3 text-left">{event.name}</td>
                <td className="px-6 py-3 text-left">{event.category}</td>
                <td className="px-6 py-3 text-left">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(event.payload, null, 2)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
