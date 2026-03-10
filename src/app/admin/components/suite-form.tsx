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
  description: z.string().min(10, 'Description must be at least 10 characters.'),
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
      description: suite?.description ?? '',
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
