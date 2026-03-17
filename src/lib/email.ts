export interface Email {
    to: string;
    from: string;
    subject: string;
    html: string;
}

export async function sendEmail(email: Email): Promise<void> {
    // In a real application, you would use an email provider like SendGrid or Nodemailer
    console.log('Sending email:', email);
}
