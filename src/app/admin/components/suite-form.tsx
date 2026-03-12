'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { DocumentSuite } from '@/lib/definitions';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  slug: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  tags: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  status: z.enum(['draft', 'published']).default('published'),
});

type SuiteFormProps = {
  suite?: Omit<DocumentSuite, 'documents'> | null;
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<boolean>;
  onFinished: () => void;
};

export function SuiteForm({ suite, onSubmit, onFinished }: SuiteFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: suite?.name ?? '',
      slug: suite?.slug ?? '',
      summary: suite?.summary ?? '',
      description: suite?.description ?? '',
      tags: suite?.tags?.join(', ') ?? '',
      seoTitle: suite?.seoTitle ?? '',
      seoDescription: suite?.seoDescription ?? '',
      status: suite?.status === 'draft' ? 'draft' : 'published',
    },
  });

  async function onFormSubmit(values: z.infer<typeof formSchema>) {
    const success = await onSubmit(values);
    if (success) {
      onFinished();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Suite Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Marketing Materials" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl><Input placeholder="auto-generated-if-empty" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Summary</FormLabel>
              <FormControl><Textarea className="resize-none" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
                <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A brief description of the documentation suite."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <FormField control={form.control} name="tags" render={({ field }) => (<FormItem><FormLabel>Tags</FormLabel><FormControl><Input placeholder="comma,separated" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="seoTitle" render={({ field }) => (<FormItem><FormLabel>SEO title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="seoDescription" render={({ field }) => (<FormItem><FormLabel>SEO description</FormLabel><FormControl><Textarea className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />

        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onFinished}>Cancel</Button>
            <Button type="submit">
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Suite'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
