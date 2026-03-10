'use client';

import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  // This wrapper ensures Firebase is only initialized on the client.
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
