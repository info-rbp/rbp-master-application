
import { firestore } from '@/firebase/server';

export interface UpsellOpportunity {
  id: string;
  userId: string;
  reason: string; // e.g., 'project_limit_reached', 'high_usage'
  status: 'identified' | 'contacted' | 'converted' | 'dismissed';
  createdAt: string;
  updatedAt: string;
}

const db = firestore;
const upsellOpportunitiesCollection = db.collection('upsell_opportunities');

/**
 * Analyzes user activity to identify potential upsell opportunities.
 * This would be triggered by various events in the system, like when a user
 * is about to hit a usage limit.
 * @param userId The ID of the user.
 * @param reason The reason for the upsell opportunity.
 */
export async function identifyUpsellOpportunity(userId: string, reason: string): Promise<UpsellOpportunity | null> {
  // Check if an opportunity has already been identified for this user and reason
  const existingSnapshot = await upsellOpportunitiesCollection
    .where('userId', '==', userId)
    .where('reason', '==', reason)
    .limit(1)
    .get();

  if (!existingSnapshot.empty) {
    return null; // Opportunity already exists
  }

  const id = db.collection('_').doc().id;
  const now = new Date().toISOString();

  const opportunity: UpsellOpportunity = {
    id,
    userId,
    reason,
    status: 'identified',
    createdAt: now,
    updatedAt: now,
  };

  await upsellOpportunitiesCollection.doc(id).set(opportunity);

  // In a real system, this might also create a task in a CRM for the sales team.

  return opportunity;
}
