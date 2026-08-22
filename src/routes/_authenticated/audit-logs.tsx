import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader, Panel, Pill, TableShell } from "@/components/tms/primitives";
import { useAuditLogs } from "@/hooks/use-tms-data";
import { dateTime, labelize, titleize } from "@/lib/tms";

export const Route = createFileRoute("/_authenticated/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs — BF101 LLC FREIGHT LOGDOG" },
      {
        name: "description",
        content:
          "Immutable audit trail of every operator action across loads, documents, shippers and carriers.",
      },
      { property: "og:title", content: "Audit Logs — BF101 LLC FREIGHT LOGDOG" },
      {
        property: "og:description",
        content: "Immutable operator action trail for regulated freight compliance.",
      },
    ],
  }),
  component: AuditLogs,
});

function AuditLogs() {
  const { data: logs = [], isLoading } = useAuditLogs();

  return (
    <>
      <PageHeader title="Audit Trail" subtitle={`${logs.length} recorded events`} />
      <Panel title="System Event Log">
        {isLoading ? (
          <EmptyState title="Loading audit trail" />
        ) : logs.length === 0 ? (
          <EmptyState title="No recorded events" />
        ) : (
          <TableShell columns={["Timestamp", "Actor", "Action", "Entity", "Detail", "Source IP"]}>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border/60 last:border-0 hover:bg-surface/60">
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                  {dateTime(log.created_at)}
                </td>
                <td className="px-5 py-3 font-medium text-foreground">{log.user_name}</td>
                <td className="px-5 py-3">
                  <Pill tone="primary">{labelize(log.action)}</Pill>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{titleize(log.entity_type)}</td>
                <td className="px-5 py-3 text-muted-foreground">{log.details}</td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{log.ip_address}</td>
              </tr>
            ))}
          </TableShell>
        )}
      </Panel>
    </>
  );
}