'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DataTable } from './data-table';
import { columns } from './columns';
import { DocumentForm } from './document-form';
import type { Document } from '@/lib/definitions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { addDocument, updateDocument as updateDocumentAction, deleteDocument as deleteDocumentAction } from '@/app/actions';

type DocumentManagerProps = {
  initialDocuments: Document[];
  suites: { id: string; name: string }[];
};

export default function DocumentManager({ initialDocuments, suites }: DocumentManagerProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const { toast } = useToast();

  const handleAddDocument = async (values: any) => {
    try {
      const newDoc = await addDocument(values);
      setDocuments(prev => [newDoc, ...prev]);
      toast({ title: "Success", description: "Document added successfully." });
      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add document." });
      return false;
    }
  };

  const handleUpdateDocument = async (id: string, values: any) => {
    try {
      const updatedDoc = await updateDocumentAction(id, values);
      if (updatedDoc) {
        setDocuments(prev => prev.map(doc => doc.id === id ? updatedDoc : doc));
        toast({ title: "Success", description: "Document updated successfully." });
      }
      return true;
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "Failed to update document." });
       return false;
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDocumentAction(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast({ title: "Success", description: "Document deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete document." });
    }
  };

  const openEditForm = (doc: Document) => {
    setEditingDocument(doc);
    setIsFormOpen(true);
  }

  const openAddForm = () => {
    setEditingDocument(null);
    setIsFormOpen(true);
  }

  return (
    <>
      <div className="flex justify-end">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={openAddForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Document
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>{editingDocument ? 'Edit Document' : 'Add New Document'}</DialogTitle>
                </DialogHeader>
                <DocumentForm 
                    suites={suites} 
                    document={editingDocument}
                    onSubmit={editingDocument ? (values) => handleUpdateDocument(editingDocument.id, values) : handleAddDocument} 
                    onFinished={() => setIsFormOpen(false)}
                />
            </DialogContent>
        </Dialog>
      </div>

      <DataTable 
        columns={columns({ onEdit: openEditForm, onDelete: handleDeleteDocument })} 
        data={documents} 
      />
    </>
  );
}
