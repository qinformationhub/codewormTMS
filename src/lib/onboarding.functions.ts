import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inviteSchema = z.object({
  orgId: z.string().uuid(),
  orgType: z.enum(["shipper", "carrier"]),
  email: z.string().email(),
  contactName: z.string(),
});

export const inviteOrganizationUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => inviteSchema.parse(data))
  .handler(async ({ data, context }) => {
    // 1. Verify caller is Admin
    const { supabase: userClient, userId } = context;
    
    // Check role
    const { data: roleData, error: roleError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error("Unauthorized: Admin privileges required");
    }

    // 2. Import admin client (service role)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 3. Invite user via Supabase Auth
    // The redirect URL should be the origin of the request
    const origin = process.env['VITE_APP_URL'] || "http://localhost:8080";
    
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
      {
        redirectTo: `${origin}/auth/callback`,
        data: {
          org_id: data.orgId,
          org_type: data.orgType,
          contact_name: data.contactName,
          role: "user"
        }
      }
    );

    if (inviteError) {
      throw inviteError;
    }

    // 4. Update the organization record
    const table = data.orgType === "shipper" ? "shippers" : "carriers";
    const { error: updateError } = await supabaseAdmin
      .from(table as any)
      .update({
        portal_email: data.email,
        portal_invitation_sent_at: new Date().toISOString(),
        status: "pending"
      } as any)
      .eq("id", data.orgId);

    if (updateError) {
      console.error(`Failed to update ${data.orgType} record:`, updateError);
    }

    // 5. Audit Log
    await supabaseAdmin.from("audit_logs").insert({
      action: "INVITE_USER",
      entity_type: data.orgType,
      entity_id: data.orgId,
      details: `Invited ${data.email} to join as ${data.orgType}`,
      user_id: userId,
      user_name: "Admin" // Simplified
    });

    return { success: true, user: inviteData.user };
  });

export const updateEntityStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    id: z.string().uuid(),
    type: z.enum(["shipper", "carrier"]),
    status: z.enum(["active", "pending", "suspended", "inactive"])
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase: userClient, userId } = context;
    
    // Admin check
    const { data: roleData } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = data.type === "shipper" ? "shippers" : "carriers";

    const { error } = await supabaseAdmin
      .from(table as any)
      .update({ status: data.status } as any)
      .eq("id", data.id);

    if (error) throw error;

    return { success: true };
  });
