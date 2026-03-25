
import { getUserNotificationPreferences } from "@/lib/notifications";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { NotificationPreferencesForm } from "./_components/notification-preferences-form";

export default async function SettingsNotificationsPage() {
  const preferences = await getUserNotificationPreferences();

  return (
    <div className="space-y-6">
      <div>
        <Heading
          title="Notifications"
          description="Manage your notification preferences."
        />
        <Separator />
      </div>
      <NotificationPreferencesForm preferences={preferences} />
    </div>
  );
}
