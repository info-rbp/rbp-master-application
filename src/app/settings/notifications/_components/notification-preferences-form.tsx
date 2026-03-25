
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { updateNotificationPreferences } from "../actions";

const notificationPreferencesFormSchema = z.object({
  email: z.object({
    marketing: z.boolean(),
    updates: z.boolean(),
  }),
});

export type NotificationPreferencesFormValues = z.infer<
  typeof notificationPreferencesFormSchema
>;

interface NotificationPreferencesFormProps {
  preferences: NotificationPreferencesFormValues;
}

export function NotificationPreferencesForm({ preferences }: NotificationPreferencesFormProps) {
  const form = useForm<NotificationPreferencesFormValues>({
    resolver: zodResolver(notificationPreferencesFormSchema),
    defaultValues: preferences,
  });

  async function onSubmit(data: NotificationPreferencesFormValues) {
    await updateNotificationPreferences(data);
    toast({
      title: "Notification preferences updated",
      description: "Your notification preferences have been successfully updated.",
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Email Notifications</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email.marketing"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Marketing emails</FormLabel>
                    <FormDescription>
                      Receive emails about new products, features, and special offers.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email.updates"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Product updates</FormLabel>
                    <FormDescription>
                      Receive emails about new features and product updates.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type="submit">Update preferences</Button>
      </form>
    </Form>
  );
}

