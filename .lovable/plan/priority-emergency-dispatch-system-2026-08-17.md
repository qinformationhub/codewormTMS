# Priority & Emergency Dispatch System

Implement a priority-based dispatching workflow for the Admin panel, extending the existing load and automated dispatch functionality.

## Database Schema
- Add `priority` column to `loads` table:
  - Type: `text` (or enum `load_priority`)
  - Values: `normal`, `priority`, `emergency`
  - Default: `normal`
- Update existing RLS policies and grants.
- Record priority changes in `audit_logs`.

## Server-side Logic (`src/lib/dispatch.server.ts`)
- Update `findEligibleCarriers` to accept sorting parameters (implied by priority flow).
- Integrate priority into the automated dispatch service:
  - Process `emergency` loads first, then `priority`, then `normal`.
- Ensure `scoreCarriers` remains consistent but the selection service prioritize these loads.

## Frontend Enhancements
- **Shared Types (`src/lib/tms.ts`)**: 
  - Define `LoadPriority` type and `PRIORITY_TONE` mapping.
- **Load Detail (`src/routes/_authenticated/loads/$loadId.tsx`)**:
  - Add priority selector for Admin users.
  - Display priority status clearly (badges/pills).
- **Load Board (`src/routes/_authenticated/loads/index.tsx`)**:
  - Display priority badges in the manifest.
  - Sort the manifest by priority by default (Emergency > Priority > Normal).

## Technical Details
- **Migration**:
  ```sql
  ALTER TABLE public.loads ADD COLUMN priority text DEFAULT 'normal';
  -- Add check constraint or enum if preferred
  ```
- **Audit Logging**: Use existing `supabase.from('audit_logs').insert(...)` logic when priority changes.
- **Sorting**: `filtered.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority))`.
