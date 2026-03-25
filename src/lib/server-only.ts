if (typeof window !== 'undefined') {
  throw new Error('This module is server-only and cannot be imported from the browser bundle.');
}

export {};
