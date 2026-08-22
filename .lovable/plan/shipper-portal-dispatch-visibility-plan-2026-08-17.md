# Shipper Portal Dispatch Visibility Plan

This plan implements visibility and tracking for the Dispatch Management Module within the Shipper Portal. Shippers will be able to monitor the dispatch status and carrier information for their loads without having control over carrier assignment.

## User Review Required

> [!IMPORTANT]
> The dispatch method (Manual/Automatic) will be visible to shippers. If this should be internal-only, please let me know.

## Proposed Changes

### Database & Backend
- No schema changes required as the existing `dispatch_assignments` table will be used.
- Ensure `getLoadDispatchHistory` server function remains read-only for Shippers (scoped via Supabase RLS).

### Shared Components & Hooks
- Update `Dashboard` recent loads table to include "Status" and "Action" as requested.
- Update `LoadBoard` manifest table for shippers to reflect current status clearly.

### Shipper Portal UI (`src/routes/_authenticated/loads/$loadId.tsx`)
- Implement `DispatchTrackingPanel` for Shippers:
    - **Dispatch Status Badge**: Clear indicator (Unassigned, Dispatched, etc.).
    - **Carrier Info**: Display carrier name and assignment timestamp once assigned.
    - **Dispatch Timeline**: A visual vertical or horizontal progress tracker:
        1. Shipment Created
        2. Awaiting Carrier Assignment
        3. Carrier Assigned
        4. Dispatched
        5. In Transit
        6. Delivered
    - **Customer-Appropriate History**: Show a filtered version of the dispatch history (current active carrier and successful past assignments, omitting internal scores/reasoning).

### Dashboard & List Views
- Update the "Recent Loads" table on the Dashboard for Shippers to include: Reference, Status, Commodity, Pickup, Delivery, Action.
- Ensure the Load Board ("My Loads" for shippers) displays the dispatch state prominently.

## Technical Details
- Use `useSessionProfile` to differentiate between `admin` and `shipper` views in `LoadDetail`.
- Filter `dispatch_assignments` data in the frontend for shippers to exclude `score` and `reasoning` fields.
- Leverage `STATUS_TONE` and `labelize` for consistent status rendering.
- Ensure the dispatch timeline reacts to `load.status` changes in real-time.
