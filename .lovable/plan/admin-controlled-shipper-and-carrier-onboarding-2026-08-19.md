# Admin-Controlled Shipper and Carrier Onboarding

Implement a secure, invitation-based onboarding workflow for Shippers and Carriers, controlled by Admins.

## User Review Required

> [!IMPORTANT]
> The "invite" feature relies on Supabase's `auth.admin.inviteUserByEmail`. This requires a `SUPABASE_SERVICE_ROLE_KEY` to be set in the environment, which is managed by Lovable Cloud.

## Proposed Changes

### Database & Security
- Add `invitation_token` and `invitation_expires_at` to `shippers` and `carriers` tables (if needed for tracking, but Supabase handles the core invite).
- Update RLS policies to ensure roles are strictly enforced (Shipper only Shipper portal, etc.).
- Add a trigger or server logic to assign the correct `app_role` upon user signup via invitation.

### Backend (Server Functions)
- Create `src/lib/onboarding.functions.ts` with `inviteOrganizationUser` server function.
- This function will:
  1. Verify the caller is an Admin.
  2. Create/Update the Shipper or Carrier record.
  3. Use `supabaseAdmin.auth.admin.inviteUserByEmail` to send the invite.
  4. Log the action in `audit_logs`.

### Admin Portal
- **Shippers/Carriers Management**: Update the "Add" forms to remove manual password assignment.
- **Invite Workflow**: Replace the direct creation with an "Invite" action that sends the email.
- **Status Management**: Add controls to Suspend/Activate/Deactivate accounts, which updates both the organization record and the Supabase Auth user status.

### Onboarding Flow
- Create a public route `src/routes/setup-account.tsx` (or similar if using Supabase default) to handle the invitation link.
- Users will set their password and activate their account here.
- Enforce role-based redirection after login.

### Visual Edits
- Update status pills to show "Pending" for invited but not yet joined users.
- Add "Invite" buttons and status toggle buttons in the Admin tables.

## Technical Details

### Schema Updates
```sql
-- Extend entity_status if needed
-- ALTER TYPE public.entity_status ADD VALUE 'suspended'; -- If not exists

-- Ensure user_roles are updated correctly
GRANT SELECT ON public.user_roles TO authenticated;
```

### Invitation Logic
Using `supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo: '...' })`.
This sends a system email with a link that carries a `type=invite` hashed token.

### Role Enforcement
The `src/routes/_authenticated/route.tsx` already checks for auth. We'll add a check for the specific role required for the sub-routes (Shipper vs Carrier).

## Constraints & Considerations
- No default passwords (Supabase invite handles this).
- Links expire (Supabase default is 24h, configurable in dashboard if accessible, otherwise handled by Supabase).
- Admin retains full control over `status`.
