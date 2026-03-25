
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/firebase/server";
import { MembershipHistory } from "./square-webhook-types";

export async function manageSubscriptions() {
    const subscriptionsRef = collection(db, "subscriptions");
    const q = query(subscriptionsRef, where("status", "==", "active"));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(async (doc) => {
        const subscription = doc.data();
        const now = new Date();

        if (subscription.endDate.toDate() < now) {
            // Subscription has expired
            await updateDoc(doc.ref, { status: "expired" });

            const userRef = doc(db, "users", subscription.userId);
            await updateDoc(userRef, { membershipStatus: "inactive" });

            const membership: MembershipHistory = {
                userId: subscription.userId,
                changeType: "deactivated",
                timestamp: new Date(),
                details: "Membership expired",
            };
            await addDoc(collection(db, "membership_history"), membership);
        } else {
            // Here you might add logic to check for cancellations via the Square API
            // For this example, we'll just focus on expirations.
        }
    });
}
