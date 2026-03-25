/**
 * Platform Firestore client – thin accessor for the admin-SDK Firestore instance.
 * All platform persistence repositories import from here rather than touching
 * firebase/server.ts directly, so we can swap the backing store later if needed.
 */
import { db } from '@/firebase/server';

export function getPlatformDb() {
  return db;
}

export type FirestoreDb = FirebaseFirestore.Firestore;
