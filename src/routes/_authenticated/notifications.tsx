import { createFileRoute } from "@tanstack/react-router";
import { useNotifications, useMarkNotificationRead } from "@/hooks/use-tms-data";
import { PageHeader, Panel, Pill, TableShell, EmptyState } from "@/components/tms/primitives";
import { Bell, Check, Clock, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { dateTime, labelize } from "@/lib/tms";
import { useSessionProfile } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — BF101 LLC FREIGHT LOGDOG" },
      { name: "description", content: "System alerts and load status updates." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data: profile } = useSessionProfile();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      markRead.mutate(n.id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "delay": return <AlertTriangle className="size-4 text-signal" />;
      case "status_update": return <Clock className="size-4 text-primary" />;
      case "assignment": return <Bell className="size-4 text-info" />;
      default: return <Info className="size-4 text-muted-foreground" />;
    }
  };

  const getSeverityTone = (severity: string) => {
    switch (severity) {
      case "high":
      case "urgent": return "danger";
      case "medium": return "warn";
      default: return "neutral";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Notification Center" 
        subtitle="System alerts, status updates and delivery exceptions"
        actions={
          notifications.some(n => !n.is_read) && (
            <button 
              onClick={handleMarkAllRead}
              className="label-mono flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xs hover:opacity-90 transition-opacity text-xs"
            >
              <Check className="size-3" /> Mark All as Read
            </button>
          )
        }
      />

      <Panel title="System Alerts">
        {isLoading ? (
          <EmptyState title="Loading notifications..." />
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications" hint="You're all caught up." />
        ) : (
          <TableShell columns={["Severity", "Type", "Message", "Time", "Status"]}>
            {notifications.map((n) => (
              <tr 
                key={n.id} 
                className={cn(
                  "border-b border-border/60 hover:bg-surface/60 transition-colors",
                  !n.is_read && "bg-primary/5 font-medium"
                )}
              >
                <td className="px-5 py-4">
                  <Pill tone={getSeverityTone((n as any).severity || 'info')} className="uppercase scale-75 origin-left">
                    {(n as any).severity || 'info'}
                  </Pill>
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    {getIcon(n.type)}
                    {labelize(n.type)}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm text-foreground max-w-md">{n.message}</p>
                </td>
                <td className="px-5 py-4 text-xs text-muted-foreground label-mono">
                  {dateTime(n.created_at)}
                </td>
                <td className="px-5 py-4">
                  {!n.is_read ? (
                    <button 
                      onClick={() => markRead.mutate(n.id)}
                      className="text-[10px] label-mono text-primary hover:underline uppercase"
                    >
                      Mark Read
                    </button>
                  ) : (
                    <span className="text-[10px] label-mono text-muted-foreground uppercase">Read</span>
                  )}
                </td>
              </tr>
            ))}
          </TableShell>
        )}
      </Panel>
    </div>
  );
}
