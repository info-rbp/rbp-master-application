
"use server";

import { updateNotificationPreferences as update } from "@/lib/notifications";
import { NotificationPreferencesFormValues } from "./_components/notification-preferences-form";

export async function updateNotificationPreferences(
  preferences: NotificationPreferencesFormValues
) {
  await update(preferences);
}
