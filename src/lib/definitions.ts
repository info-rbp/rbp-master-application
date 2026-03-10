export type Document = {
  id: string;
  name: string;
  description: string;
  url: string;
  type: 'file' | 'drive';
  createdAt: string;
  suiteId: string;
};

export type DocumentSuite = {
  id: string;
  name:string;
  description: string;
  documents: Document[];
};
