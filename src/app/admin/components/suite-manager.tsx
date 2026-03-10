'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DataTable } from './data-table';
import { columns } from './suite-columns';
import { SuiteForm } from './suite-form';
import type { DocumentSuite } from '@/lib/definitions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { addSuite, updateSuite, deleteSuite } from '@/app/actions';

type SuiteManagerProps = {
  initialSuites: Array<Omit<DocumentSuite, 'documents'>>;
};

export default function SuiteManager({ initialSuites }: SuiteManagerProps) {
  const [suites, setSuites] = useState(initialSuites);
  const [isSuiteFormOpen, setIsSuiteFormOpen] = useState(false);
  const [editingSuite, setEditingSuite] = useState<Omit<DocumentSuite, 'documents'> | null>(null);
  const { toast } = useToast();

  const handleAddSuite = async (values: any) => {
    try {
      const newSuite = await addSuite(values);
      setSuites(prev => [...prev, newSuite]);
      toast({ title: "Success", description: "Suite added successfully." });
      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add suite." });
      return false;
    }
  };

  const handleUpdateSuite = async (id: string, values: any) => {
    try {
      const updatedSuite = await updateSuite(id, values);
      if (updatedSuite) {
        setSuites(prev => prev.map(s => s.id === id ? updatedSuite : s));
        toast({ title: "Success", description: "Suite updated successfully." });
      }
      return true;
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "Failed to update suite." });
       return false;
    }
  };

  const handleDeleteSuite = async (id: string) => {
    try {
      await deleteSuite(id);
      setSuites(prev => prev.filter(s => s.id !== id));
      toast({ title: "Success", description: "Suite deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete suite." });
    }
  };
  
  const openEditForm = (suite: Omit<DocumentSuite, 'documents'>) => {
    setEditingSuite(suite);
    setIsSuiteFormOpen(true);
  }

  const openAddForm = () => {
    setEditingSuite(null);
    setIsSuiteFormOpen(true);
  }

  return (
    <>
      <div className="flex justify-end gap-2">
         <Dialog open={isSuiteFormOpen} onOpenChange={(isOpen) => {
            setIsSuiteFormOpen(isOpen);
            if (!isOpen) {
              setEditingSuite(null);
            }
         }}>
            <DialogTrigger asChild>
                <Button onClick={openAddForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Suite
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>{editingSuite ? 'Edit Suite' : 'Add New Suite'}</DialogTitle>
                </DialogHeader>
                <SuiteForm
                    suite={editingSuite}
                    onSubmit={editingSuite ? (values) => handleUpdateSuite(editingSuite.id, values) : handleAddSuite}
                    onFinished={() => {
                      setIsSuiteFormOpen(false);
                      setEditingSuite(null);
                    }}
                />
            </DialogContent>
        </Dialog>
      </div>

      <DataTable 
        columns={columns({ onEdit: openEditForm, onDelete: handleDeleteSuite })} 
        data={suites} 
      />
    </>
  );
}
