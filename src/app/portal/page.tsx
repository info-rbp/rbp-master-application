import { getDocumentSuites } from '@/lib/data';
import PortalClientView from './components/portal-client-view';

export default async function PortalPage() {
  const documentSuites = await getDocumentSuites();

  return (
    <PortalClientView documentSuites={documentSuites} />
  );
}
