# Driver Management Module Implementation Plan

Implement a comprehensive Driver Management system integrated with existing Carrier and Load workflows.

## User Review Required

> [!IMPORTANT]
> - Performance metrics (on-time delivery, completion rate) will be calculated in real-time based on actual `loads` data.
> - "Contractor" status will be stored as an employment type field on the driver profile.
> - License/Certification expiration alerts will be visual indicators in the UI.

## Proposed Changes

### Database Schema (Supabase Migration)
- Expand `drivers` table:
    - Add `date_of_birth`, `license_type`, `license_expiration`.
    - Add `certification_name`, `certification_expiration`.
    - Add `employment_type` (employee vs contractor).
    - Add `availability_status` (available, assigned, unavailable, inactive).
- Add indexes on `loads(driver_id)` and `drivers(availability_status)` for performance.

### Backend Logic
- Update `src/lib/dispatch.server.ts`:
    - Refine `createDispatchAssignment` to handle driver availability updates.
    - Add `getDriverPerformance` helper to calculate metrics (loads completed, late deliveries) from the `loads` table.
- Update `src/hooks/use-tms-data.ts`:
    - Expand `Driver` type definition.
    - Add `useDrivers` and `useDriver(id)` hooks.

### Admin Portal
- **Driver Management Hub (`src/routes/_authenticated/drivers.tsx`)**:
    - Update to show expanded table for Admins: Name, Carrier, License Status, Type, Performance.
    - Implement search and filtering by Carrier and Employment Type.
    - Add "Edit Driver" and "Performance View" modals.
- **Load Detail (`src/routes/_authenticated/loads/$loadId.tsx`)**:
    - Enhance "Driver Assignment" to prevent assigning "Unavailable" or "Inactive" drivers.
    - Show real-time performance snippets next to driver names in the selector.

### Carrier Portal
- **My Fleet (`src/routes/_authenticated/drivers.tsx`)**:
    - Carrier-specific view showing only their drivers.
    - License tracking dashboard with color-coded expiration warnings.
    - Driver assignment history view.

### Shipper Portal
- **Tracking View**:
    - Read-only driver display (Name, Phone) on active shipments.
    - No access to internal certifications or performance data.

## Technical Details
- **Expiration Logic**: `< 30 days` = Expiring Soon (Yellow), `< 0 days` = Expired (Red).
- **Performance Formulas**: 
    - On-Time % = `(On-Time Loads / Total Assigned) * 100`.
    - Completion % = `(Delivered Loads / (Delivered + Cancelled)) * 100`.
- **Real-time**: Supabase Realtime will sync availability status across all operator screens.

## Verification Plan
- **Automated Tests**:
    - Verify that a driver assigned to Carrier A cannot be assigned to a load for Carrier B.
    - Verify that deactivating a driver prevents them from appearing in assignment lists.
- **Manual Checks**:
    - Validate that Shippers cannot see driver PII (SSN/License type) through API response inspection.
    - Verify expiration pills change color correctly based on date thresholds.
