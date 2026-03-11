import { getDocumentSuites } from '@/lib/data';
import PortalClientView from './components/portal-client-view';
import { getActiveAnnouncements } from '@/lib/announcements';

export default async function PortalPage() {
  const [documentSuites, announcements] = await Promise.all([
    getDocumentSuites(),
    getActiveAnnouncements('member'),
  ]);

  return <PortalClientView documentSuites={documentSuites} announcements={announcements} />;
}
