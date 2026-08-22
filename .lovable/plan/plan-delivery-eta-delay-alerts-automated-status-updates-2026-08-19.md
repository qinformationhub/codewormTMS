# Plan - Delivery ETA, Delay Alerts & Automated Status Updates

Implement a comprehensive notification and communication system that tracks load status changes, detects delays, and provides real-time alerts across Admin, Shipper, and Carrier portals.

## User Review Required

> [!IMPORTANT]
> - Automated status notifications will be triggered by status updates in the Load Board.
> - Delay alerts will be generated when a load's `delivery_date` is passed without it being marked as "delivered".
> - Notifications will be visible in a new "Notification Center" accessible from the top navigation bar.

## Proposed Changes

### Database & Backend
- Create `notifications` table with role-based RLS.
- Implement Postgres triggers for automated status updates (Dispatched, Picked Up, etc.).
- Implement delay detection logic based on delivery deadlines.

### Hooks & State
- Add `useNotifications` hook to `src/hooks/use-tms-data.ts`.
- Integrate notification counts and real-time updates using Supabase Realtime.

### UI Components
- **Notification Inbox**: A dropdown or dedicated section in `AppShell` to view and manage notifications.
- **Visual Alerts**: Highlight delayed loads in manifest tables and detail pages.
- **Real-time Indicators**: Badge counts on the notification icon.

### Portal Specifics
- **Admin**: Oversight of all generated notifications and system-wide delay alerts.
- **Shipper**: Track shipment milestones (Carrier assigned -> Delivered) and exceptions.
- **Carrier**: Focus on assigned load deadlines and dispatch status changes.

## Technical Details

- **Table**: `public.notifications` (id, user_id, load_id, type, message, is_read, created_at).
- **Notification Types**: `carrier_assigned`, `load_dispatched`, `pickup_completed`, `in_transit`, `delivered`, `delayed`, `exception_raised`.
- **Triggers**: `AFTER UPDATE ON public.loads` to auto-generate notification rows.
- **Realtime**: Subscribe to `notifications` channel for the current user's ID.

## Verification Plan

### Automated Tests
- Verify notification creation on status change via SQL queries.
- Check RLS isolation (Carrier A cannot see Shipper B's notifications).

### Manual Verification
1. Log in as Admin, create a load, and assign a carrier.
2. Verify Shipper and Carrier receive "Carrier Assigned" notifications.
3. Update load status to "In Transit" and verify notifications.
4. Manually set a delivery date in the past for an active load and verify "Delayed" alert generation.
5. Mark notifications as read and verify persistence.
