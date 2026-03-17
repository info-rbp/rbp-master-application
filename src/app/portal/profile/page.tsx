import { requireMemberAuth } from '../_lib/member-auth';
import { MemberProfile } from '@/components/portal/member-profile';
import { getUserBadges } from '@/lib/gamification/badges';
import { firestore } from '@/firebase/server';

export default async function ProfilePage() {
    const auth = await requireMemberAuth();
    const userBadges = await getUserBadges(auth.userId);
    const userDoc = await firestore.collection('users').doc(auth.userId).get();
    const user = userDoc.data();

    return (
        <div className="container mx-auto p-4">
            <MemberProfile
                name={user?.displayName || 'Member'}
                email={auth.email || ''}
                badges={userBadges}
                points={user?.points || 0}
            />
        </div>
    );
}
