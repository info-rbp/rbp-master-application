'use client';
import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

let firestoreEmulatorConnected = false;

const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'demo-api-key',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'demo.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-project',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'demo-project.appspot.com',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '000000000000',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:000000000000:web:demo',
};

// Initialize Firebase for client-side rendering
export function initializeFirebase() {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
        if (auth.emulatorConfig === null) {
            connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
                disableWarnings: true,
            });
        }
        if (!firestoreEmulatorConnected) {
            connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
            firestoreEmulatorConnected = true;
        }
    }
    return { firebaseApp: app, auth, firestore };
}
