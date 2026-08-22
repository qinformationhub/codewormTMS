import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SectionTitle, Field, field } from "@/components/tms/form-fields";
import { PageHeader, Panel } from "@/components/tms/primitives";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const handleAuth = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        toast.error("Authentication failed");
        navigate({ to: "/", replace: true });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setSetupMode(true);
        setLoading(false);
      } else {
        const timer = setTimeout(() => {
          if (loading) navigate({ to: "/", replace: true });
        }, 5000);
        cleanup = () => clearTimeout(timer);
      }
    };

    void handleAuth();
    return () => cleanup?.();
  }, [navigate, loading]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Account activated successfully");
    navigate({ to: "/dashboard", replace: true });
  };

  if (loading && !setupMode) {
    return (
      <div className="flex h-screen items-center justify-center bg-card text-foreground">
        <div className="text-center">
          <p className="display-title animate-pulse text-xl">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (setupMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-card px-6 py-16">
        <div className="w-full max-w-md">
          <PageHeader 
            title="Complete Account Setup" 
            subtitle="Set your secure password to activate your portal access." 
          />
          <Panel title="Security Configuration" className="mt-8">
            <form onSubmit={handleSetup} className="space-y-6">
              <Field label="New Password">
                <input
                  type="password"
                  required
                  className={field}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  minLength={8}
                />
              </Field>
              <Field label="Confirm Password">
                <input
                  type="password"
                  required
                  className={field}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  minLength={8}
                />
              </Field>
              <button
                type="submit"
                disabled={loading}
                className="label-mono flex h-12 w-full items-center justify-center rounded-xs bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Activating..." : "Activate Account & Login"}
              </button>
            </form>
          </Panel>
        </div>
      </div>
    );
  }

  return null;
}
