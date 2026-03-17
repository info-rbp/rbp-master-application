
import { createHmac } from 'crypto';

/**
 * Validates a Square webhook signature.
 * @param notificationUrl The notification URL for the webhook subscription.
 * @param payload The raw request body.
 * @param signature The value of the X-Square-Signature header.
 * @param secret The webhook signature key.
 * @returns True if the signature is valid, false otherwise.
 */
export async function isValidSquareWebhook(notificationUrl: string, payload: string, signature: string, secret: string): Promise<boolean> {
    const stringToSign = notificationUrl + payload;
    const hmac = createHmac('sha256', secret);
    hmac.update(stringToSign);
    const hash = hmac.digest('base64');
    return hash === signature;
}
