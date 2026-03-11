import { firestore } from '@/firebase/server';

export async function getAdminSummaryMetrics() {
  const [users, enquiries, downloads, offers, unreadAdmin] = await Promise.all([
    firestore.collection('users').get(),
    firestore.collection('contact_enquiries').get(),
    firestore.collection('analytics_events').where('eventType', '==', 'resource_downloaded').get(),
    firestore.collection('partner_offers').where('active', '==', true).get(),
    firestore.collection('notifications').where('audienceRole', '==', 'admin').where('read', '==', false).get(),
  ]);

  let activeMembers = 0;
  let lapsedMembers = 0;

  users.docs.forEach((doc) => {
    const status = String(doc.data().membershipStatus ?? '').toLowerCase();
    if (status === 'active') activeMembers += 1;
    if (['expired', 'lapsed', 'canceled', 'past_due'].includes(status)) lapsedMembers += 1;
  });

  return {
    newSignups: users.size,
    activeMembers,
    lapsedMembers,
    totalEnquiries: enquiries.size,
    totalResourceDownloads: downloads.size,
    activeOffers: offers.size,
    unreadAdminNotifications: unreadAdmin.size,
  };
}

export async function getResourceUsageMetrics() {
  const [views, downloads] = await Promise.all([
    firestore.collection('analytics_events').where('eventType', '==', 'resource_viewed').get(),
    firestore.collection('analytics_events').where('eventType', '==', 'resource_downloaded').get(),
  ]);

  const summarize = (snapshot: FirebaseFirestore.QuerySnapshot) => {
    const byResource = new Map<string, number>();
    snapshot.docs.forEach((doc) => {
      const resourceId = String(doc.data().resourceId ?? 'unknown');
      byResource.set(resourceId, (byResource.get(resourceId) ?? 0) + 1);
    });
    return [...byResource.entries()].map(([resourceId, count]) => ({ resourceId, count }));
  };

  return {
    viewsByResource: summarize(views).sort((a, b) => b.count - a.count),
    downloadsByResource: summarize(downloads).sort((a, b) => b.count - a.count),
  };
}

export { computeConversionRate } from "./wave3-helpers";
