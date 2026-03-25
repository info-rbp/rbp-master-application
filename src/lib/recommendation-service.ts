
import { firestore } from '@/firebase/server';

const db = firestore;
const userHistoryCollection = db.collection('user_content_history');
const contentCollection = db.collection('content'); // Assuming a 'content' collection

/**
 * Tracks that a user has viewed a piece of content.
 * @param userId The ID of the user.
 * @param contentId The ID of the content being viewed.
 */
export async function trackContentView(userId: string, contentId: string): Promise<void> {
  const now = new Date().toISOString();
  const historyRef = userHistoryCollection.doc(`${userId}_${contentId}`);
  await historyRef.set({
    userId,
    contentId,
    viewedAt: now,
  }, { merge: true });
}

/**
 * Generates content recommendations for a user based on their viewing history.
 * @param userId The ID of the user.
 * @param limit The maximum number of recommendations to return.
 * @returns A list of recommended content IDs.
 */
export async function getRecommendations(userId: string, limit: number = 5): Promise<string[]> {
  // Get the user's viewing history
  const historySnapshot = await userHistoryCollection.where('userId', '==', userId).limit(10).get();
  const viewedContentIds = historySnapshot.docs.map(doc => doc.data().contentId);

  if (viewedContentIds.length === 0) {
    // If no history, return a default set of popular content
    const popularContent = await contentCollection.orderBy('viewCount', 'desc').limit(limit).get();
    return popularContent.docs.map(doc => doc.id);
  }

  // For this basic recommendation engine, we'll find content that users with similar
  // viewing habits have also viewed. A more advanced engine would use collaborative filtering.

  // Find other users who viewed the same content
  const similarUsersSnapshot = await userHistoryCollection
    .where('contentId', 'in', viewedContentIds)
    .where('userId', '!=', userId)
    .limit(10)
    .get();
  
  const similarUserIds = [...new Set(similarUsersSnapshot.docs.map(doc => doc.data().userId))];

  if (similarUserIds.length === 0) {
    return []; // No other users with similar tastes found
  }

  // Find content those similar users have viewed
  const recommendedContentSnapshot = await userHistoryCollection
    .where('userId', 'in', similarUserIds)
    .where('contentId', 'not-in', viewedContentIds)
    .limit(limit)
    .get();

  return [...new Set(recommendedContentSnapshot.docs.map(doc => doc.data().contentId))];
}
