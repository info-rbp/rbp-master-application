import type { Document, DocumentSuite } from './definitions';

let documents: Document[] = [
  {
    id: 'doc-1',
    suiteId: 'suite-1',
    name: 'Project Brief Template.docx',
    description: 'A comprehensive template for creating detailed project briefs. Includes sections for objectives, target audience, and deliverables.',
    url: '#',
    type: 'file',
    createdAt: '2023-10-26T10:00:00Z',
  },
  {
    id: 'doc-2',
    suiteId: 'suite-1',
    name: 'Marketing Plan Q4.pdf',
    description: 'The official marketing plan for the fourth quarter, outlining key strategies, campaigns, and budget allocations.',
    url: '#',
    type: 'file',
    createdAt: '2023-10-25T14:30:00Z',
  },
  {
    id: 'doc-3',
    suiteId: 'suite-2',
    name: 'Onboarding Checklist for New Hires',
    description: 'A step-by-step checklist to ensure a smooth onboarding process for new employees, linked from Google Drive.',
    url: '#',
    type: 'drive',
    createdAt: '2023-09-15T09:00:00Z',
  },
  {
    id: 'doc-4',
    suiteId: 'suite-2',
    name: 'Employee Handbook.pdf',
    description: 'The official company employee handbook covering policies, procedures, and company culture.',
    url: '#',
    type: 'file',
    createdAt: '2023-09-10T11:00:00Z',
  },
    {
    id: 'doc-5',
    suiteId: 'suite-3',
    name: 'Q3 Financial Report.xlsx',
    description: 'Detailed financial report for the third quarter, including profit and loss statements and balance sheets.',
    url: '#',
    type: 'file',
    createdAt: '2023-10-20T16:00:00Z',
  },
];

let suites: Omit<DocumentSuite, 'documents'>[] = [
    {
        id: 'suite-1',
        name: 'Project Management Resources',
        description: 'Templates and guides for effective project planning and execution.'
    },
    {
        id: 'suite-2',
        name: 'Human Resources',
        description: 'Essential documents for employee onboarding and company policies.'
    },
    {
        id: 'suite-3',
        name: 'Financial Reports',
        description: 'Quarterly and annual financial statements for the company.'
    }
]

// Simulate a database join
export async function getDocumentSuites(): Promise<DocumentSuite[]> {
  return suites.map(suite => ({
    ...suite,
    documents: documents
      .filter(doc => doc.suiteId === suite.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  }));
}

export async function getAllDocuments(): Promise<Document[]> {
    return [...documents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getSuites(): Promise<Omit<DocumentSuite, 'documents'>[]> {
  return [...suites];
}

export async function addDocument(doc: Omit<Document, 'id' | 'createdAt'>): Promise<Document> {
    const newDoc: Document = {
        ...doc,
        id: `doc-${Date.now()}`,
        createdAt: new Date().toISOString(),
    }
    documents.unshift(newDoc);
    return newDoc;
}

export async function updateDocument(id: string, data: Partial<Document>): Promise<Document | null> {
    const index = documents.findIndex(d => d.id === id);
    if(index === -1) return null;
    documents[index] = { ...documents[index], ...data };
    return documents[index];
}

export async function deleteDocument(id: string): Promise<boolean> {
    const initialLength = documents.length;
    documents = documents.filter(d => d.id !== id);
    return documents.length < initialLength;
}

export async function addSuite(suite: Omit<DocumentSuite, 'id' | 'documents'>): Promise<Omit<DocumentSuite, 'documents'>> {
    const newSuite = {
        ...suite,
        id: `suite-${Date.now()}`,
    };
    suites.push(newSuite);
    return newSuite;
}