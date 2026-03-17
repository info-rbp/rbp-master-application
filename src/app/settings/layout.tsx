import { ReactNode } from 'react';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <nav className="col-span-1">
          <ul>
            <li><a href="/settings/profile">Profile</a></li>
            <li><a href="/settings/company">Company</a></li>
            <li><a href="/settings/security">Security</a></li>
          </ul>
        </nav>
        <main className="col-span-3">{children}</main>
      </div>
    </div>
  );
}
