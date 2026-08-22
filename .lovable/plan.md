# Plan: Hazmat & Compliance Document Management

Implement a complete Hazmat and Compliance Document Management system integrated into the existing Load workflow, with specific functionality for Admin, Shipper, and Carrier roles.

## User Review Required

> [!IMPORTANT]
> - Do you need email notifications when a document is expiring or rejected?
> - Should carriers be able to upload their own compliance documents (e.g., driver certifications) specifically for a load, or only view what's provided? (Currently planned as read-only per instructions).
> - Should "Document Number" be required for certain document types (like permits)?

## Proposed Changes

### Database Schema Expansion
- Update the `documents` table (or add new columns) to support:
  - `doc_number`: Document number/identifier.
  - `issued_at`: Issue date.
  - `status`: Enum (Pending Review, Valid, Expired, Rejected).
  - `review_notes`: Feedback from Admin on rejection.
  - `reviewed_by`/`reviewed_at`: Audit trail for verification.
- Add `doc_history` table for versioning/audit logs (who uploaded, updated, reviewed, or deleted).

### UI/UX Updates

#### Admin Portal
- **Load Detail Page**: Add a "Hazmat & Compliance" tab or section to the Load Detail.
  - CRUD operations for documents.
  - Verification workflow (Verify/Reject buttons with notes).
  - Expiration tracking indicators.
- **Global Document Vault**: Update the existing vault to filter for Hazmat/Compliance specifically.

#### Shipper Portal
- **Load Detail Page**: Add a "Hazmat & Compliance Documents" section.
  - Upload form with: Type, Number, Issue Date, Expiry, File.
  - Grid view of uploaded documents with current verification status.

#### Carrier Portal
- **Load Detail Page**: Add a read-only "Compliance Documents" section.
  - View and download documents required for the assigned load (e.g., Shipping Papers, Permits).
  - Restricted to only assigned loads via RLS.

### Technical Details
- **RLS Policies**: Enforce load-level access:
  - Shippers can only see/upload for loads they own.
  - Carriers can only see documents for loads assigned to them.
  - Admins have full access.
- **Form Validation**: Zod schemas for the new document metadata.
- **File Storage**: Use Supabase Storage (existing `documents` bucket) with appropriate path structures.

## Verification Plan

### Automated Tests
- Test RLS policies to ensure a Carrier cannot access a Shipper's private documents for an unassigned load.
- Validate status transition logic (e.g., only Admin can set to 'Valid').

### Manual Verification
- Log in as Shipper: Upload a "Hazmat Permit" to a load.
- Log in as Admin: Verify the document exists, change status to "Valid".
- Log in as Carrier: Verify the document is downloadable for the assigned load.
- Check "Settings > Audit Logs" to ensure document actions are recorded.
