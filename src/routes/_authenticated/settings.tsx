import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Mail, Save, Loader2 } from "lucide-react";

import { PageHeader, Panel, Pill } from "@/components/tms/primitives";
import { useSessionProfile } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { labelize } from "@/lib/tms";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Terminal Settings — BF101 LLC FREIGHT LOGDOG" },
      {
        name: "description",
        content:
          "Review your operator profile, portal role, session security details and terminal build information.",
      },
      { property: "og:title", content: "Terminal Settings — BF101 LLC FREIGHT LOGDOG" },
      {
        property: "og:description",
        content: "Operator profile and terminal configuration.",
      },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { data: profile } = useSessionProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  // Sync state with profile data when it loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  const isAdmin = profile?.role === "admin";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  async function handleUpdateCredentials(e: React.FormEvent) {
    e.preventDefault();
    setUpdating(true);
    
    try {
      const updates: { email?: string; password?: string; data?: { full_name: string } } = {};
      if (password) updates.password = password;
      
      // Admin cannot update email via auth, but can update metadata
      if (!isAdmin && email && email !== profile?.email) {
        updates.email = email;
      }

      if (fullName && fullName !== profile?.full_name) {
        updates.data = { full_name: fullName };
      }

      if (Object.keys(updates).length === 0) {
        toast.info("No changes to update");
        return;
      }

      const { error } = await supabase.auth.updateUser(updates);
      
      if (error) throw error;

      // Also update the profiles table for full_name
      if (fullName !== profile?.full_name && profile?.id) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: fullName })
          .eq("id", profile.id);
        if (profileError) throw profileError;
      }
      
      toast.success("Profile updated successfully");
      setPassword("");
      
      if (updates.email) {
        toast.info("Check your new email for a confirmation link");
      }
      
      await queryClient.invalidateQueries({ queryKey: ["session-profile"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to update credentials");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      <PageHeader title="Terminal Settings" subtitle="Operator profile and system configuration." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Panel title="Operator Profile">
            <dl className="divide-y divide-border">
              {[
                ["Full Name", profile?.full_name ?? "—"],
                ["Email", profile?.email ?? "—"],
                ["Portal Role", labelize(profile?.role)],
                ["Operator ID", profile?.id.slice(0, 8).toUpperCase() ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 px-5 py-4">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="font-mono text-sm font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Security Credentials">
            <form onSubmit={handleUpdateCredentials} className="space-y-4 p-5">
              <div>
                <label className="label-mono mb-2 block text-xs text-muted-foreground">Full Name</label>
                <div className="flex items-center gap-2 rounded-xs bg-secondary px-4">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="h-11 w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              {!isAdmin && (
                <div>
                  <label className="label-mono mb-2 block text-xs text-muted-foreground">Update Email</label>
                  <div className="flex items-center gap-2 rounded-xs bg-secondary px-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={profile?.email}
                      className="h-11 w-full bg-transparent text-sm outline-none"
                    />
                    <Mail className="size-4 text-muted-foreground" />
                  </div>
                </div>
              )}
              
              <div>
                <label className="label-mono mb-2 block text-xs text-muted-foreground">Update Password</label>
                <div className="flex items-center gap-2 rounded-xs bg-secondary px-4">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="h-11 w-full bg-transparent text-sm outline-none"
                  />
                  <KeyRound className="size-4 text-muted-foreground" />
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="label-mono flex w-full items-center justify-center gap-2 rounded-xs bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {updating ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save Changes
              </button>
              
              {isAdmin && (
                <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  Admin email is locked to {profile?.email}
                </p>
              )}
            </form>
          </Panel>
        </div>

        <Panel title="System">
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Terminal Build</span>
              <Pill tone="primary">V1.0.4</Pill>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network Status</span>
              <Pill tone="ok">Online</Pill>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Audit Logging</span>
              <Pill tone="ok">Enabled</Pill>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="label-mono mt-4 w-full rounded-xs bg-signal px-4 py-3 text-signal-foreground transition-opacity hover:opacity-90"
            >
              Sign Out of Terminal
            </button>
          </div>
        </Panel>
      </div>
    </>
  );
}
