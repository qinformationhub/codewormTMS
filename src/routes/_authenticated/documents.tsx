import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DocumentUploadDialog } from "@/components/tms/document-upload-dialog";
import { EmptyState, PageHeader, Panel, Pill, TableShell } from "@/components/tms/primitives";
import { useCarriers, useDocuments, useLoads, useShippers } from "@/hooks/use-tms-data";
import { supabase } from "@/integrations/supabase/client";
import { labelize, shortDate, titleize } from "@/lib/tms";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Compliance Documents — BF101 LLC FREIGHT LOGDOG" },
      {
        name: "description",
        content:
          "Central document vault for bills of lading, insurance certificates, HazMat permits and GDP compliance records.",
      },
      { property: "og:title", content: "Compliance Documents — BF101 LLC FREIGHT LOGDOG" },
      {
        property: "og:description",
        content: "Document vault with verification status and expiry tracking.",
      },
    ],
  }),
  component: Documents,
});

function Documents() {
  const queryClient = useQueryClient();
  const { data: documents = [], isLoading } = useDocuments();
  const { data: loads = [] } = useLoads();
  const { data: shippers = [] } = useShippers();
  const { data: carriers = [] } = useCarriers();
  const [filter, setFilter] = useState<"all" | string>("all");

  const categories = Array.from(new Set(documents.map((d) => d.category)));
  const filtered = filter === "all" ? documents : documents.filter((d) => d.category === filter);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document removed");
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function links(doc: (typeof documents)[number]) {
    const parts: string[] = [];
    const load = loads.find((l) => l.id === doc.load_id);
    if (load) parts.push(load.reference);
    const shipper = shippers.find((s) => s.id === doc.shipper_id);
    if (shipper) parts.push(shipper.name);
    const carrier = carriers.find((c) => c.id === doc.carrier_id);
    if (carrier) parts.push(carrier.name);
    return parts.length ? parts.join(" · ") : "Not linked";
  }

  return (
    <>
      <PageHeader
        title="Compliance Vault"
        subtitle={`${documents.length} documents on file`}
        actions={<DocumentUploadDialog />}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {["all", ...categories].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={cn(
              "label-mono rounded-xs px-3 py-2 transition-colors",
              filter === c
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {labelize(c)}
          </button>
        ))}
      </div>

      <Panel title="Document Register">
        {isLoading ? (
          <EmptyState title="Loading documents" />
        ) : filtered.length === 0 ? (
          <EmptyState title="No documents in this category" />
        ) : (
          <TableShell
            columns={[
              "File",
              "Category",
              "Type",
              "Owner",
              "Status",
              "Links",
              "Uploaded By",
              "Expires",
              "Actions",
            ]}
          >
            {filtered.map((doc) => {
              const expiring =
                doc.expires_at &&
                new Date(doc.expires_at).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 60;
              return (
                <tr key={doc.id} className="border-b border-border/60 last:border-0 hover:bg-surface/60">
                  <td className="px-5 py-3 font-medium text-foreground">{doc.file_name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{titleize(doc.category)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{doc.doc_type || "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{titleize(doc.owner_type)}</td>
                  <td className="px-5 py-3">
                    <Pill
                      tone={
                        doc.status === "verified" || doc.status === "valid"
                          ? "ok"
                          : doc.status === "rejected"
                            ? "danger"
                            : "warn"
                      }
                    >
                      {labelize(doc.status)}
                    </Pill>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{links(doc)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{doc.uploaded_by_name || "—"}</td>
                  <td className={cn("px-5 py-3", expiring ? "text-signal" : "text-muted-foreground")}>
                    {shortDate(doc.expires_at)}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => remove.mutate(doc.id)}
                      aria-label={`Delete ${doc.file_name}`}
                      className="rounded-xs bg-secondary p-2 text-muted-foreground transition-colors hover:text-signal"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </TableShell>
        )}
      </Panel>
    </>
  );
}
