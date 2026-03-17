
import { NextRequest, NextResponse } from 'next/server';
import { identifyUpsellOpportunity } from '@/lib/upsell-service';

// This endpoint would typically be called by other internal services, not directly by the client.
// For the purpose of this example, we'll allow it to be called directly.
export async function POST(request: NextRequest) {
  const { userId, reason } = await request.json();

  if (!userId || !reason) {
    return NextResponse.json({ error: 'Missing userId or reason' }, { status: 400 });
  }

  try {
    const opportunity = await identifyUpsellOpportunity(userId, reason);
    if (opportunity) {
      return NextResponse.json(opportunity);
    } else {
      return NextResponse.json({ message: 'Opportunity already identified' });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to identify upsell opportunity' }, { status: 500 });
  }
}
