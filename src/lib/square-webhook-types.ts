
// Defines the structure for a user's profile, including their membership status.
export interface UserProfile {
    // The user's unique identifier.
    uid: string;
    // The user's email address.
    email: string;
    // The current status of the user's membership (e.g., 'active', 'inactive', 'lapsed').
    membershipStatus: 'active' | 'inactive' | 'lapsed';
    // The tier of the user's membership (e.g., 'basic', 'standard', 'premium').
    membershipTier: 'basic' | 'standard' | 'premium';
    // The Square-specific customer identifier.
    squareCustomerId: string;
}

// Represents a user's subscription details.
export interface Subscription {
    // The unique identifier for the subscription.
    subscriptionId: string;
    // The identifier of the user who owns the subscription.
    userId: string;
    // The subscription tier (e.g., 'premium').
    tier: string;
    // The date when the subscription started.
    startDate: Date;
    // The date when the subscription is set to expire.
    endDate: Date;
    // The current status of the subscription (e.g., 'active', 'canceled').
    status: 'active' | 'canceled';
}

// Records an individual billing event.
export interface BillingHistory {
    // The unique identifier for the payment.
    paymentId: string;
    // The identifier of the user who was billed.
    userId: string;
    // The amount that was billed.
    amount: number;
    // The date of the billing event.
    date: Date;
    // The status of the payment (e.g., 'completed', 'failed').
    status: 'completed' | 'failed';
}

// Logs changes to a user's membership status.
export interface MembershipHistory {
    // The identifier of the user whose membership changed.
    userId: string;
    // The type of change that occurred (e.g., 'activated', 'deactivated', 'upgraded').
    changeType: 'activated' | 'deactivated' | 'upgraded' | 'downgraded';
    // The timestamp of when the change occurred.
    timestamp: Date;
    // Additional details about the membership change.
    details: string;
}
