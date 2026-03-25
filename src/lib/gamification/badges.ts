import { firestore } from '@/firebase/server';
import { safeLogAnalyticsEvent } from '../analytics-server';
import { ANALYTICS_EVENTS } from '../analytics-events';

export interface Badge {
    id: string;
    name: string;
    description: string;
    tier: 'bronze' | 'silver' | 'gold';
    icon: string;
}

export const BADGES: Record<string, Badge> = {
    first_feedback: {
        id: 'first_feedback',
        name: 'Feedback Pioneer',
        description: 'Awarded for providing your first piece of feedback.',
        tier: 'bronze',
        icon: 'star',
    },
    feedback_pro: {
        id: 'feedback_pro',
        name: 'Feedback Pro',
        description: 'Awarded for providing 10 pieces of feedback.',
        tier: 'silver',
        icon: 'star',
    },
    feedback_master: {
        id: 'feedback_master',
        name: 'Feedback Master',
        description: 'Awarded for providing 50 pieces of feedback.',
        tier: 'gold',
        icon: 'star',
    },
    onboarding_complete: {
        id: 'onboarding_complete',
        name: 'Onboarding Complete',
        description: 'Awarded for completing the onboarding checklist.',
        tier: 'bronze',
        icon: 'check-circle',
    },
};

export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
    const badge = BADGES[badgeId];
    if (!badge) return false;

    const userBadgesRef = firestore.collection('users').doc(userId).collection('badges').doc(badgeId);
    const userBadge = await userBadgesRef.get();

    if (userBadge.exists) {
        return false; // Badge already awarded
    }

    await userBadgesRef.set({ ...badge, awardedAt: new Date() });
    await safeLogAnalyticsEvent({
        eventType: ANALYTICS_EVENTS.BADGE_AWARDED,
        targetId: badgeId,
        targetType: 'badge',
        userId,
    });
    return true;
}

export async function getUserBadges(userId: string): Promise<Badge[]> {
    const badgesRef = firestore.collection('users').doc(userId).collection('badges');
    const snapshot = await badgesRef.get();
    return snapshot.docs.map((doc) => doc.data() as Badge);
}
