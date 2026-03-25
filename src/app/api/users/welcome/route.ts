import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { WelcomeEmail } from '@/emails/welcome-email';

export async function POST(request: Request) {
    const { name, email } = await request.json();

    if (!name || !email) {
        return NextResponse.json({ error: 'Missing name or email' }, { status: 400 });
    }

    const welcomeEmail = WelcomeEmail({ name });
    welcomeEmail.to = email;

    await sendEmail(welcomeEmail);

    return NextResponse.json({ success: true });
}
