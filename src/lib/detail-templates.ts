import type { ContentObjectType, RenderableContentObject } from './content-objects';

export type DetailTemplateDefinition = {
  key: ContentObjectType;
  sections: Array<{ title: string; bodyKey: keyof NonNullable<RenderableContentObject['templateFields']>; listKey: keyof NonNullable<RenderableContentObject['templateFields']> }>;
};

const TEMPLATE_MAP: Record<ContentObjectType, DetailTemplateDefinition> = {
  docshare_template: {
    key: 'docshare_template',
    sections: [
      { title: 'Template Details', bodyKey: 'templateDetails', listKey: 'whatsIncluded' },
      { title: 'Companion Resources', bodyKey: 'companionResources', listKey: 'relatedTemplates' },
      { title: 'Implementation Notes', bodyKey: 'implementationNotes', listKey: 'implementationSteps' },
    ],
  },
  docshare_companion_guide: {
    key: 'docshare_companion_guide',
    sections: [
      { title: 'Guide Purpose', bodyKey: 'guidePurpose', listKey: 'guideSections' },
      { title: 'Related Templates', bodyKey: 'relatedTemplatesSummary', listKey: 'relatedTemplates' },
      { title: 'Related Resources', bodyKey: 'relatedResourcesSummary', listKey: 'relatedResources' },
    ],
  },
  docshare_documentation_suite: {
    key: 'docshare_documentation_suite',
    sections: [
      { title: 'Suite Contents', bodyKey: 'suiteContentsSummary', listKey: 'suiteContents' },
      { title: 'Document Structure', bodyKey: 'documentStructure', listKey: 'documentStructureItems' },
      { title: 'Implementation Order', bodyKey: 'implementationOrderSummary', listKey: 'implementationOrder' },
    ],
  },
  docshare_end_to_end_process: {
    key: 'docshare_end_to_end_process',
    sections: [
      { title: 'Process Stages', bodyKey: 'processOverview', listKey: 'processStages' },
      { title: 'Roles / Ownership', bodyKey: 'rolesAndOwnershipSummary', listKey: 'rolesAndOwnership' },
      { title: 'Included Documents & Tools', bodyKey: 'includedAssetsSummary', listKey: 'includedAssets' },
    ],
  },
  docshare_tool: {
    key: 'docshare_tool',
    sections: [
      { title: 'Tool Components', bodyKey: 'toolOverview', listKey: 'toolComponents' },
      { title: 'How It Works', bodyKey: 'howItWorks', listKey: 'howItWorksSteps' },
      { title: 'When To Use', bodyKey: 'whenToUseSummary', listKey: 'whenToUse' },
    ],
  },
  partner_offer: {
    key: 'partner_offer',
    sections: [
      { title: 'Offer Details', bodyKey: 'offerDetails', listKey: 'offerHighlights' },
      { title: 'About the Partner', bodyKey: 'partnerOverview', listKey: 'partnerServices' },
      { title: 'Claim / Redemption', bodyKey: 'claimInstructions', listKey: 'claimChecklist' },
      { title: 'Terms & Conditions', bodyKey: 'termsAndConditions', listKey: 'termsHighlights' },
    ],
  },
  knowledge_center_article: {
    key: 'knowledge_center_article',
    sections: [
      { title: 'Article Summary', bodyKey: 'articleSummary', listKey: 'keyTakeaways' },
      { title: 'Embedded Resources', bodyKey: 'embeddedResourcesSummary', listKey: 'embeddedResources' },
    ],
  },
  knowledge_center_guide: {
    key: 'knowledge_center_guide',
    sections: [
      { title: 'Guide Summary', bodyKey: 'guideSummary', listKey: 'guideSections' },
      { title: 'Downloadable Resources', bodyKey: 'downloadableResourcesSummary', listKey: 'downloadableResources' },
    ],
  },
  knowledge_center_tool: {
    key: 'knowledge_center_tool',
    sections: [
      { title: 'Tool Overview', bodyKey: 'toolOverview', listKey: 'toolComponents' },
      { title: 'How It Works', bodyKey: 'howItWorks', listKey: 'howItWorksSteps' },
      { title: 'Example Application', bodyKey: 'exampleApplication', listKey: 'exampleSteps' },
    ],
  },
  knowledge_center_knowledge_base: {
    key: 'knowledge_center_knowledge_base',
    sections: [
      { title: 'Knowledge Summary', bodyKey: 'articleSummary', listKey: 'keyTakeaways' },
      { title: 'Related Resources', bodyKey: 'relatedResourcesSummary', listKey: 'relatedResources' },
    ],
  },
  service_page: {
    key: 'service_page',
    sections: [
      { title: 'Service Overview', bodyKey: 'serviceOverview', listKey: 'problemsSolved' },
      { title: "What's Included", bodyKey: 'serviceInclusionsSummary', listKey: 'serviceInclusions' },
      { title: 'Membership Discount', bodyKey: 'membershipDiscountMessage', listKey: 'discountHighlights' },
      { title: 'Discovery Call Booking', bodyKey: 'discoveryCallBooking', listKey: 'bookingSteps' },
    ],
  },
  docshare_resource: {
    key: 'docshare_resource',
    sections: [{ title: 'Resource Snapshot', bodyKey: 'resourceOverview', listKey: 'resourceHighlights' }],
  },
};

export function getTemplateForContentType(contentType: ContentObjectType): DetailTemplateDefinition {
  return TEMPLATE_MAP[contentType];
}
