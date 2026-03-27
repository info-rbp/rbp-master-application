import { buildSeoMetadata } from '@/lib/seo';
import {
  HeroSection,
  ApplicationsOverviewSection,
  ApplicationCardsSection,
  WhoTheyAreForSection,
  CtaBlockSection
} from '@/components/applications-landing';

export const metadata = buildSeoMetadata({
  title: 'Applications',
  description: 'Explore a suite of powerful, ready-to-use applications to solve your toughest business challenges.',
  path: '/applications'
});

// Placeholder data structure for applications
const applications = [
  {
    id: 'app-001',
    title: 'Financial Projection Modeler',
    summary: 'Create detailed financial projections and model different scenarios to forecast revenue, expenses, and profitability.',
    audience: 'Strategic Leaders, Financial Teams',
    accessLink: 'https://portal.example.com/applications/financial-modeler'
  },
  {
    id: 'app-002',
    title: 'Competitive Landscape Analyzer',
    summary: 'Track competitors, analyze their market positioning, and identify strategic opportunities and threats.',
    audience: 'Strategic Leaders',
    accessLink: 'https://portal.example.com/applications/competitive-analyzer'
  },
  {
    id: 'app-003',
    title: 'Operational Efficiency Calculator',
    summary: 'Identify bottlenecks, calculate efficiency gains, and model the impact of process improvements on your bottom line.',
    audience: 'Operational Units',
    accessLink: 'https://portal.example.com/applications/efficiency-calculator'
  },
    {
    id: 'app-004',
    title: 'Go-to-Market Strategy Planner',
    summary: 'Develop a comprehensive GTM strategy, including target audience, channel mix, and launch timeline.',
    audience: 'Strategic Leaders',
    accessLink: 'https://portal.example.com/applications/gtm-planner'
  },
  {
    id: 'app-005',
    title: 'Customer Lifetime Value (CLV) Calculator',
    summary: 'Calculate the lifetime value of your customers and identify your most valuable segments.',
    audience: 'Financial Teams',
    accessLink: 'https://portal.example.com/applications/clv-calculator'
  },
  {
    id: 'app-006',
    title: 'Project Management Dashboard',
    summary: 'Track project progress, manage tasks, and collaborate with your team in a single, centralized dashboard.',
    audience: 'Operational Units',
    accessLink: 'https://portal.example.com/applications/pm-dashboard'
  }
];

export default function ApplicationsPage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <ApplicationsOverviewSection />
      <ApplicationCardsSection applications={applications} />
      <WhoTheyAreForSection />
      <CtaBlockSection />
    </div>
  );
}
