import { NextRequest, NextResponse } from 'next/server';
import { awardBadge } from '@/lib/gamification/badges';
import { addPoints } from '@/lib/gamification/points';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { contentId, contentType, userId, rating, comment } = body;

        // In a real-world application, you would save this feedback to a database.
        console.log('Feedback received:', { contentId, contentType, userId, rating, comment });

        if (userId) {
            // Award the 'first_feedback' badge to the user if they haven't received it yet.
            await awardBadge(userId, 'first_feedback');
            await addPoints(userId, 'feedback');
        }

        return NextResponse.json({ message: 'Feedback submitted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        return NextResponse.json({ message: 'Failed to submit feedback' }, { status: 500 });
    }
}
