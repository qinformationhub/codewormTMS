import { Link } from "@tanstack/react-router";

import { useState } from "react";
import { Bell, CheckCircle, Info, Clock, AlertTriangle, AlertCircle } from "lucide-react";
import { useNotifications, useMarkNotificationRead } from "@/hooks/use-tms-data";
import { dateTime, labelize } from "@/lib/tms";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationCenter() {
  const { data: notifications, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  const getIcon = (type: string) => {
    switch (type) {
      case "delivered":
        return <CheckCircle className="size-4 text-ok" />;
      case "delayed":
      case "sla_warning":
        return <AlertTriangle className="size-4 text-signal" />;
      case "exception_raised":
        return <AlertCircle className="size-4 text-warn" />;
      case "delivery_approaching":
        return <Clock className="size-4 text-info" />;
      default:
        return <Info className="size-4 text-primary" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative grid size-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-signal text-[10px] font-bold text-signal-foreground">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden border-border bg-card shadow-lg">
        <div className="border-b border-border bg-sidebar px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="label-mono text-xs font-semibold text-sidebar-accent-foreground">Notifications</p>
            <Link 
              to="/notifications" 
              className="text-[10px] label-mono text-signal hover:underline uppercase"
              onClick={() => setIsOpen(false)}
            >
              View All
            </Link>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-none border-b border-border/50 px-4 py-3 transition-colors focus:bg-accent",
                  !n.is_read && "bg-primary/5"
                )}
                onClick={() => {
                  if (!n.is_read) markRead(n.id);
                }}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getIcon(n.type)}
                    <span className="label-mono text-[10px] uppercase text-muted-foreground">
                      {labelize(n.type)}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{dateTime(n.created_at)}</span>
                </div>
                <p className="text-sm font-medium leading-tight text-foreground">{n.message}</p>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
