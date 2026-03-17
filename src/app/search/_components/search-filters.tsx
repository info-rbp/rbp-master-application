
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { contentTypes } from "@/lib/content-types";

const searchFiltersSchema = z.object({
  query: z.string().optional(),
  type: z.string().optional(),
});

export type SearchFiltersFormValues = z.infer<typeof searchFiltersSchema>;

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<SearchFiltersFormValues>({
    resolver: zodResolver(searchFiltersSchema),
    defaultValues: {
      query: searchParams.get("query") ?? "",
      type: searchParams.get("type") ?? "all",
    },
  });

  function onSubmit(data: SearchFiltersFormValues) {
    const params = new URLSearchParams();
    if (data.query) {
      params.set("query", data.query);
    }
    if (data.type) {
      params.set("type", data.type);
    }
    router.push(`/search?${params.toString()}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Search</FormLabel>
                <FormControl>
                  <Input placeholder="Search..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <select {...field} className="w-full p-2 border rounded-md">
                    <option value="all">All</option>
                    {contentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit">Search</Button>
      </form>
    </Form>
  );
}
