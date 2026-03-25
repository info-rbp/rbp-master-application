import Link from 'next/link';

export default function AccessDeniedPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
      <h1 className="text-3xl font-bold">Access denied</h1>
      <p className="text-muted-foreground">
        Your current tenant, role, or module access does not allow this action.
      </p>
      <div className="flex justify-center gap-3">
        <Link className="underline" href="/dashboard">Go to dashboard</Link>
        <Link className="underline" href="/login">Sign in with a different account</Link>
      </div>
    </div>
  );
}
