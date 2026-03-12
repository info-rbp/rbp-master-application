import { getActivePartnerOffers, getDocuShareSectionContent, getHomepageContent, getKnowledgeLandingContent, getMembershipPageContent, getPublishedServicePages, getServicesLandingContent } from './data';

export type ReadinessStatus = 'ready' | 'warning';

export type ReadinessCheck = {
  key: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
};

const REQUIRED_ENV_GROUPS: Array<{ key: string; label: string; vars: string[] }> = [
  { key: 'firebase', label: 'Firebase', vars: ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'] },
  { key: 'square', label: 'Square', vars: ['SQUARE_ACCESS_TOKEN', 'SQUARE_ENVIRONMENT', 'SQUARE_LOCATION_ID', 'SQUARE_WEBHOOK_SIGNATURE_KEY'] },
  { key: 'email', label: 'Email delivery', vars: ['EMAIL_PROVIDER_API_KEY', 'EMAIL_FROM_ADDRESS'] },
  { key: 'runtime', label: 'Runtime URLs', vars: ['NEXT_PUBLIC_APP_URL'] },
];

export function validateRequiredEnv(env: NodeJS.ProcessEnv = process.env): ReadinessCheck[] {
  return REQUIRED_ENV_GROUPS.map((group) => {
    const missing = group.vars.filter((name) => !env[name]?.trim());
    return {
      key: `env:${group.key}`,
      label: `${group.label} environment`,
      status: missing.length === 0 ? 'ready' : 'warning',
      detail: missing.length === 0 ? 'All required variables are set.' : `Missing: ${missing.join(', ')}`,
    };
  });
}

export async function getLaunchReadinessChecks(): Promise<ReadinessCheck[]> {
  const [homepage, membership, knowledge, servicesLanding, docushare, services, offers] = await Promise.all([
    getHomepageContent(),
    getMembershipPageContent(),
    getKnowledgeLandingContent(),
    getServicesLandingContent(),
    getDocuShareSectionContent('landing'),
    getPublishedServicePages(),
    getActivePartnerOffers(),
  ]);

  const contentChecks: ReadinessCheck[] = [
    {
      key: 'content:homepage',
      label: 'Homepage content',
      status: homepage?.title && homepage?.description ? 'ready' : 'warning',
      detail: homepage?.title && homepage?.description ? 'Homepage title and description are configured.' : 'Homepage title/description still uses fallback content.',
    },
    {
      key: 'content:membership',
      label: 'Membership landing content',
      status: membership?.title && membership?.description ? 'ready' : 'warning',
      detail: membership?.title && membership?.description ? 'Membership landing copy is configured.' : 'Membership landing copy is incomplete.',
    },
    {
      key: 'content:knowledge',
      label: 'Knowledge Center landing content',
      status: knowledge?.title && knowledge?.description ? 'ready' : 'warning',
      detail: knowledge?.title && knowledge?.description ? 'Knowledge Center copy is configured.' : 'Knowledge Center content still relies on fallback copy.',
    },
    {
      key: 'content:docushare',
      label: 'DocuShare landing content',
      status: docushare?.title && docushare?.description ? 'ready' : 'warning',
      detail: docushare?.title && docushare?.description ? 'DocuShare landing copy is configured.' : 'DocuShare landing content still relies on fallback copy.',
    },
    {
      key: 'content:services',
      label: 'Published services',
      status: services.length > 0 && servicesLanding?.title ? 'ready' : 'warning',
      detail: services.length > 0 ? `${services.length} published service page(s) found.` : 'No published service pages found.',
    },
    {
      key: 'content:offers',
      label: 'Active partner offers',
      status: offers.length > 0 ? 'ready' : 'warning',
      detail: offers.length > 0 ? `${offers.length} active partner offer(s) found.` : 'No active partner offers found.',
    },
  ];

  return [...validateRequiredEnv(), ...contentChecks];
}
