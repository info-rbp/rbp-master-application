'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { getTicket } from '../actions';
import { Badge } from '@/components/ui/badge';

export default function TicketPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTicket(params.id).then(result => {
      if (result.success) {
        setTicket(result.ticket);
      } else {
        setError(result.error || 'Failed to load ticket.');
      }
      setLoading(false);
    });
  }, [params.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!ticket) {
    return <div>Ticket not found.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{ticket.subject}</CardTitle>
                <CardDescription>
                    Ticket opened on {new Date(ticket.createdAt).toLocaleDateString()}
                </CardDescription>
            </div>
            <Badge className={`${ticket.status === 'open' ? 'bg-green-500' : 'bg-red-500'}`}>{ticket.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <div>
                <h3 className="font-bold">Priority</h3>
                <p>{ticket.priority}</p>
            </div>
            <div>
                <h3 className="font-bold">Message</h3>
                <p className="whitespace-pre-wrap">{ticket.message}</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
