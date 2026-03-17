'use client';

import { useEffect, useState } from 'react';
import { firestore } from '@/firebase/client';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { AnalyticsEvent } from '@/lib/analytics/taxonomy';

export default function AnalyticsDashboardPage() {
    const [events, setEvents] = useState<AnalyticsEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const eventsCollection = collection(firestore, 'analyticsEvents');
                const q = query(eventsCollection, orderBy('timestamp', 'desc'));
                const querySnapshot = await getDocs(q);
                const fetchedEvents = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        ...data,
                        // Firestore Timestamps need to be converted to a serializable format
                        timestamp: data.timestamp?.toDate().toISOString(),
                    } as AnalyticsEvent;
                });
                setEvents(fetchedEvents);
            } catch (error) {
                console.error('Error fetching analytics events:', error);
            }
            setLoading(false);
        }

        fetchEvents();
    }, []);

    if (loading) {
        return <div>Loading events...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Platform Analytics Events</h1>
            <div className="bg-white shadow-md rounded my-6">
                <table className="min-w-max w-full table-auto">
                    <thead>
                        <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 text-left">Timestamp</th>
                            <th className="py-3 px-6 text-left">Event Name</th>
                            <th className="py-3 px-6 text-left">Category</th>
                            <th className="py-3 px-6 text-left">Payload</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-light">
                        {events.map((event, index) => (
                            <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                                <td className="py-3 px-6 text-left whitespace-nowrap">
                                    {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'N/A'}
                                </td>
                                <td className="py-3 px-6 text-left">
                                    {event.name}
                                </td>
                                <td className="py-3 px-6 text-left">
                                    {event.category}
                                </td>
                                <td className="py-3 px-6 text-left">
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
