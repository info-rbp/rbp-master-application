import { firestore } from '@/firebase/server';
import { safeLogAnalyticsEvent } from '../analytics-server';
import { ANALYTICS_EVENTS } from '../analytics-events';

export const POINTS_SYSTEM = {
    feedback: 10,
    login: 5,
    content_view: 1,
};

export async function addPoints(userId: string, event: keyof typeof POINTS_SYSTEM): Promise<void> {
    const points = POINTS_SYSTEM[event];
    if (!points) return;

    const userRef = firestore.collection('users').doc(userId);
    const user = await userRef.get();

    if (user.exists) {
        const currentPoints = user.data()?.points || 0;
        await userRef.update({ points: currentPoints + points });
    } else {
        await userRef.set({ points });
    }

    await safeLogAnalyticsEvent({
        eventType: ANALYTICS_EVENTS.POINTS_AWARDED,
        targetId: event,
        targetType: 'point_event',
        userId,
        metadata: { pointsAwarded: points },
    });
}
