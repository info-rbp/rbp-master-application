import { EventEmitter } from 'events';

// This is a simple event emitter that allows different parts of the application
// to communicate without direct dependencies. It's used here to broadcast
// Firestore permission errors to a central listener.
export const errorEmitter = new EventEmitter();
