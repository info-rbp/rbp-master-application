'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateDescriptionForDocument } from '../actions';
import { Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Document } from '@/lib/definitions';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  description: z.string().optional(),
  type: z.enum(['file', 'drive']),
  suiteId: z.string().nonempty('Please select a suite.'),
  url: z.string().url('Please enter a valid URL.'),
});

type DocumentFormProps = {
  suites: { id: string; name: string }[];
  document?: Document | null;
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<boolean>;
  onFinished: () => void;
};

export function DocumentForm({ suites, document, onSubmit, onFinished }: DocumentFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const [fileForDesc, setFileForDesc] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: document?.name ?? '',
      description: document?.description ?? '',
      type: document?.type ?? 'file',
      suiteId: document?.suiteId ?? '',
      url: document?.url ?? '#',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('name', file.name);
      // For a real implementation, you would upload the file and get a URL.
      // Here we just set a placeholder.
      form.setValue('url', '#');
      setFileForDesc(file);
    }
  };

  const handleGenerateDescription = async () => {
    if (!fileForDesc) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a file to generate a description.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        if (!dataUri) {
             toast({ variant: 'destructive', title: 'Error', description: 'Could not read file.' });
             setIsGenerating(false);
             return;
        }
        const result = await generateDescriptionForDocument({
          documentDataUri: dataUri,
          documentTitle: fileForDesc.name,
        });

        if (result.success && result.description) {
          form.setValue('description', result.description);
          toast({ title: 'Success', description: 'Description generated.' });
        } else {
          throw new Error(result.error);
        }
      };
      reader.onerror = () => {
        throw new Error('Failed to read file.');
      }
      reader.readAsDataURL(fileForDesc);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: (error as Error).message || 'Could not generate description.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  async function onFormSubmit(values: z.infer<typeof formSchema>) {
    const success = await onSubmit(values);
    if (success) {
      onFinished();
    }
  }

  const type = form.watch('type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="suiteId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Documentation Suite</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a suite" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {suites.map((suite) => (
                    <SelectItem key={suite.id} value={suite.id}>
                      {suite.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="file">File Upload</SelectItem>
                  <SelectItem value="drive">Google Drive Link</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {type === 'file' && (
          <FormItem>
            <FormLabel>Upload File</FormLabel>
            <FormControl>
              <Input type="file" onChange={handleFileChange} />
            </FormControl>
            <FormDescription>
              This will pre-fill the name. The URL will be set upon upload.
            </FormDescription>
          </FormItem>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Marketing Plan Q4.pdf" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {type === 'drive' && (
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Google Drive URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://docs.google.com/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>Description</FormLabel>
                {type === 'file' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating || !fileForDesc}
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Generate with AI
                  </Button>
                )}
              </div>
              <FormControl>
                <Textarea
                  placeholder="A brief description of the document."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onFinished}>Cancel</Button>
            <Button type="submit">
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Document'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
