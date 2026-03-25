import { Email } from '@/lib/email';

interface WelcomeEmailProps {
    name: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps): Email {
    return {
        to: '', // The 'to' address will be set when the email is sent
        from: 'Conselo <noreply@conselo.io>',
        subject: 'Welcome to Conselo!',
        html: `<h1>Welcome, ${name}!</h1><p>Thanks for joining Conselo. We're excited to have you on board.</p>`,
    };
}
