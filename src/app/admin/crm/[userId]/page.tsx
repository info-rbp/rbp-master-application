
'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Subscription, BillingHistory, MembershipHistory } from '@/lib/square-webhook-types';

export default function UserDetailPage({ params }: { params: { userId: string } }) {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [membershipHistory, setMembershipHistory] = useState<MembershipHistory[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const userRef = doc(db, 'users', params.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUser(userSnap.data());
      }

      const subRef = collection(db, 'subscriptions');
      const qSub = query(subRef, where("userId", "==", params.userId));
      const subSnap = await getDocs(qSub);
      if (!subSnap.empty) {
        setSubscription(subSnap.docs[0].data() as Subscription);
      }

      const billRef = collection(db, 'billing_history');
      const qBill = query(billRef, where("userId", "==", params.userId));
      const billSnap = await getDocs(qBill);
      setBillingHistory(billSnap.docs.map(doc => doc.data() as BillingHistory));

      const memRef = collection(db, 'membership_history');
      const qMem = query(memRef, where("userId", "==", params.userId));
      const memSnap = await getDocs(qMem);
      setMembershipHistory(memSnap.docs.map(doc => doc.data() as MembershipHistory));
    };
    fetchUserData();
  }, [params.userId]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">User Details</h1>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Membership Status:</strong> {user.membershipStatus}</p>

      <h2 className="text-xl font-bold mt-8 mb-4">Subscription</h2>
      {subscription ? (
        <div>
          <p><strong>Tier:</strong> {subscription.tier}</p>
          <p><strong>Status:</strong> {subscription.status}</p>
          <p><strong>Start Date:</strong> {new Date(subscription.startDate).toLocaleDateString()}</p>
          <p><strong>End Date:</strong> {new Date(subscription.endDate).toLocaleDateString()}</p>
        </div>
      ) : (
        <p>No subscription found.</p>
      )}

      <h2 className="text-xl font-bold mt-8 mb-4">Billing History</h2>
      <table className="w-full text-left">
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {billingHistory.map((item, index) => (
            <tr key={index}>
              <td>{new Date(item.date).toLocaleDateString()}</td>
              <td>${(item.amount / 100).toFixed(2)}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-bold mt-8 mb-4">Membership History</h2>
      <ul className="space-y-2">
        {membershipHistory.map((item, index) => (
          <li key={index}>
            {new Date(item.timestamp).toLocaleString()}: {item.details}
          </li>
        ))}
      </ul>
    </div>
  );
}
