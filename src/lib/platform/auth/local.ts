import { findBootstrapUserByEmail, resolvePrincipalFromBootstrap } from '../bootstrap';
import type { AuthenticatedPrincipal } from '../types';

export function authenticateLocalUser(input: { email: string; password: string }): AuthenticatedPrincipal | null {
  const seeded = findBootstrapUserByEmail(input.email);
  if (!seeded) return null;
  if (input.password !== 'password123!') return null;
  return resolvePrincipalFromBootstrap({ email: input.email });
}
