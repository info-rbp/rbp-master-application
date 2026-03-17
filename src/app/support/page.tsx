'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getTickets } from './actions';

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    getTickets().then(result => {
      if (result.success) {
        setTickets(result.tickets || []);
      }
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <Button asChild>
          <Link href="/support/new">Create New Ticket</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length > 0 ? (
            <ul className="space-y-4">
              {tickets.map(ticket => (
                <li key={ticket.id} className="border p-4 rounded-md flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{ticket.subject}</h3>
                    <p className={`text-sm ${ticket.status === 'open' ? 'text-green-500' : 'text-red-500'}`}>
                      {ticket.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                    <Button asChild variant="link">
                        <Link href={`/support/${ticket.id}`}>View</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>You have no support tickets.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
