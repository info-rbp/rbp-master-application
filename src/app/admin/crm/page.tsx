
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  membershipStatus: string;
}

export default function CrmPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(userList);
    };
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { membershipStatus: newStatus });
    setUsers(users.map(user => user.id === userId ? { ...user, membershipStatus: newStatus } : user));
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Member CRM</h1>
      <table className="w-full text-left">
        <thead>
          <tr>
            <th>Email</th>
            <th>Membership Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.membershipStatus}</td>
              <td>
                <Link href={`/admin/crm/${user.id}`} passHref>
                  <Button>View Details</Button>
                </Link>
                <Button className="ml-2" onClick={() => handleStatusChange(user.id, 'active')}>Activate</Button>
                <Button className="ml-2" onClick={() => handleStatusChange(user.id, 'inactive')}>Deactivate</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
