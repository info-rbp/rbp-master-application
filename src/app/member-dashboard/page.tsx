
'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useAuth } from '@/firebase/provider';
import { MarketingHeader } from '@/components/marketing-header';
import { MarketingFooter } from '@/components/marketing-footer';
import { BillingHistory } from '@/lib/square-webhook-types';

interface SavedContent {
  id: string;
  type: string;
  content: any;
  savedAt: any;
}

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const [membershipStatus, setMembershipStatus] = useState('');
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [savedContent, setSavedContent] = useState<SavedContent[]>([]);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnap) => {
        if (docSnap.exists()) {
          setMembershipStatus(docSnap.data().membershipStatus);
        }
      });

      const billingHistoryRef = collection(db, 'billing_history');
      const qBilling = query(billingHistoryRef, where("userId", "==", user.uid));
      getDocs(qBilling).then((querySnapshot) => {
        const history: BillingHistory[] = [];
        querySnapshot.forEach((doc) => {
          history.push(doc.data() as BillingHistory);
        });
        setBillingHistory(history);
      });

      const savedContentRef = collection(db, 'saved_content');
      const qSaved = query(savedContentRef, where("userId", "==", user.uid));
      getDocs(qSaved).then((querySnapshot) => {
        const content: SavedContent[] = [];
        querySnapshot.forEach((doc) => {
          content.push({ id: doc.id, ...doc.data() } as SavedContent);
        });
        setSavedContent(content);
      });
    }
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-col container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">Member Dashboard</h1>
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Membership Status</h2>
            <p>Your current membership status is: <strong>{membershipStatus}</strong></p>
          </div>
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Billing History</h2>
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
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4">Saved Content</h2>
            <ul className="space-y-4">
              {savedContent.map((item) => (
                <li key={item.id} className="border rounded-lg p-4">
                  <h3 className="font-bold">{item.content.name}</h3>
                  <p>{item.content.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
