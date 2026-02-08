# SystemFailed — Change Log

## Session: 2026-02-07

---

## Change 1: Support Incidents with Deaths OR Injuries + Multiple Victims

### Problem
The platform only tracked deaths. Needed to support both deaths and serious injuries, allow multiple victims per incident, and rename "Report a Death" to "Report an Incident" everywhere.

### Data Model Changes

**`src/types/incident.ts`**
- Added new type: `OutcomeType = 'Death' | 'Serious_Injury'`
- Added fields to `Incident` interface:
  - `outcome_type: OutcomeType`
  - `death_count: number`
  - `injury_count: number`
- Renamed `date_of_death` to `date_of_incident`

**`supabase/schema.sql`**
- Added columns: `outcome_type` (default `'Death'`), `death_count` (default `1`), `injury_count` (default `0`)
- Added CHECK constraints: `outcome_type IN ('Death', 'Serious_Injury')`, `death_count >= 0`, `injury_count >= 0`
- Renamed column `date_of_death` to `date_of_incident`
- Updated all 3 seed INSERT statements with new columns

> **IMPORTANT:** The schema.sql is a setup script. For an existing live Supabase database, run this migration instead:
> ```sql
> ALTER TABLE public.incidents RENAME COLUMN date_of_death TO date_of_incident;
> ALTER TABLE public.incidents
>   ADD COLUMN outcome_type text NOT NULL DEFAULT 'Death'
>     CHECK (outcome_type IN ('Death', 'Serious_Injury')),
>   ADD COLUMN death_count integer NOT NULL DEFAULT 1
>     CHECK (death_count >= 0),
>   ADD COLUMN injury_count integer NOT NULL DEFAULT 0
>     CHECK (injury_count >= 0);
> ```

**`src/data/seed.ts`**
- All 3 seed incidents updated with `outcome_type: 'Death'`, `death_count: 1`, `injury_count: 0`
- Renamed `date_of_death` to `date_of_incident`

### Service Layer Changes

**`src/services/incidents.ts`**
- Added `outcome_type`, `death_count`, `injury_count` to `CreateIncidentInput`
- Renamed `date_of_death` to `date_of_incident` in `CreateIncidentInput` and `createIncident()`
- Added new `getDeathCount()` function:
  - Seed mode: sums `death_count` across `seedIncidents`
  - Supabase mode: selects `death_count` from all incidents and sums them
- Kept existing `getIncidentCount()` for total incident count

### UI Changes

**`src/components/DeathCounter.tsx`**
- Changed from `getIncidentCount()` to `getDeathCount()` — counter now shows sum of deaths, not total incidents

**`src/components/ReportForm.tsx`** (Step 1)
- Added **Outcome Type toggle**: Death (red) / Serious Injury (yellow) button selector
- Added **Count field**: dynamically labeled "Number of Deaths" or "Number Injured" based on outcome type selection, defaults to 1
- Renamed "Date of Death" label to "Date of Incident"
- All internal `date_of_death` references renamed to `date_of_incident`

**`src/components/IncidentCard.tsx`**
- Both compact and full card views now show an **outcome badge**:
  - Deaths: red badge, e.g. "1 Death" or "3 Deaths"
  - Injuries: yellow badge, e.g. "2 Injured"

**`src/components/layout/Navbar.tsx`**
- "Report a Death" changed to "Report an Incident" (desktop + mobile)

**`src/App.tsx`**
- "REPORT A DEATH" heading changed to "REPORT AN INCIDENT"

### Files Modified
1. `src/types/incident.ts`
2. `supabase/schema.sql`
3. `src/data/seed.ts`
4. `src/services/incidents.ts`
5. `src/components/DeathCounter.tsx`
6. `src/components/ReportForm.tsx`
7. `src/components/IncidentCard.tsx`
8. `src/components/layout/Navbar.tsx`
9. `src/App.tsx`

---

## Change 2: Nominatim Geocoding for Map Coordinates

### Problem
When submitting a new incident, the lat/lng were hardcoded to `0, 0`. Incidents wouldn't appear on the map.

### Solution
Integrated OpenStreetMap's Nominatim geocoding API to automatically convert address+city+state into lat/lng coordinates during submission.

**`src/services/incidents.ts`**
- Added `geocodeAddress(address, city, state)` function:
  - Calls `https://nominatim.openstreetmap.org/search` with the combined query
  - Scoped to India via `countrycodes=in`
  - Includes `User-Agent: SystemFailed/1.0` header (Nominatim requires this)
  - Returns `{ lat, lng }` on success, falls back to `{ lat: 0, lng: 0 }` on failure
- `createIncident()` now runs geocoding and photo upload in **parallel** via `Promise.all`
- Location object uses geocoded coordinates instead of hardcoded `0, 0`

### Notes
- No API key required
- Rate limited to 1 request/second by Nominatim policy
- No new dependencies added — uses native `fetch`

### Files Modified
1. `src/services/incidents.ts`

---

## Change 3: Evidence Links Input

### Problem
The `Incident` type had `evidence_links: string[]` but there was no way for users to add links when submitting a report. Links were always saved as an empty array.

### Solution
Added a dynamic links input to the report form and wired it through the service layer.

**`src/services/incidents.ts`**
- Added `evidence_links?: string[]` to `CreateIncidentInput`
- `createIncident()` passes `input.evidence_links ?? []` to the incident object

**`src/components/ReportForm.tsx`**
- Added `evidence_links: string[]` to form state (initial value: `[]`)
- Added UI in **Step 2** (Location & Evidence):
  - "Add link" button appends a new URL input field
  - Each link has an X button to remove it
  - Placeholder: `https://...`
  - Helper text: "News articles, tweets, or any relevant URLs"
- Empty links are filtered out before submission
- Imported `Plus` and `X` icons from lucide-react

### Files Modified
1. `src/services/incidents.ts`
2. `src/components/ReportForm.tsx`

---

## Session: 2026-02-07 (Evening)

---

## Change 4: Fixed Syntax Error in IncidentCard

### Problem
Homepage was crashing with error: `'return' outside of function` at line 46 in `IncidentCard.tsx`.

### Root Cause
Extra closing brace `}` on line 41 was prematurely closing the `handleUpvote` function, causing the subsequent `return` statement to appear outside any function.

### Solution
Removed the extra closing brace from the `handleUpvote` function.

**`src/components/IncidentCard.tsx`**
- Fixed function closing brace (line 41)

### Files Modified
1. `src/components/IncidentCard.tsx`

---

## Change 5: Upvote Count Not Updating in UI

### Problem
After upvoting an incident, the upvote count wasn't increasing on the page even though the upvote was being recorded.

### Root Cause
The `IncidentList` component fetched incidents once on mount, but when upvoting, only the local state in `IncidentCard` updated. The parent component still had stale data and wasn't refetching.

### Solution
Implemented callback pattern to refresh incidents after upvoting.

**`src/features/incidents/IncidentList.tsx`**
- Extracted data fetching into `loadData()` function
- Passed `onUpvote={loadData}` callback to all `IncidentCard` instances (latest, recent, and most upvoted)

**`src/components/IncidentCard.tsx`**
- Added `onUpvote?: () => void` to `IncidentCardProps`
- Called `onUpvote?.()` after successful upvote in `handleUpvote()`

### Files Modified
1. `src/features/incidents/IncidentList.tsx`
2. `src/components/IncidentCard.tsx`

---

## Session: 2026-02-08

---

## Change 6: Database Schema Missing Upvote Functionality

### Problem
Even after UI fixes, upvote counts weren't persisting in the database. The code was calling `increment_upvote()` RPC function, but it didn't exist in Supabase.

### Root Cause
The database schema was missing:
1. `upvote_count` column in the `incidents` table
2. `increment_upvote()` RPC function for atomic updates

### Solution
Created database migration and updated schema files.

**`supabase/add_upvotes.sql`** (NEW FILE)
- Adds `upvote_count integer not null default 0` column with CHECK constraint
- Creates index `idx_incidents_upvote_count` for efficient sorting
- Creates `increment_upvote(incident_id uuid)` RPC function that:
  - Atomically increments the count
  - Returns the new count
  - Uses `security definer` to bypass RLS

**`supabase/schema.sql`**
- Added `upvote_count` column to incidents table definition
- Added index for `upvote_count`
- Added `increment_upvote()` RPC function (section 7)
- Renumbered seed section from 6 to 8

**`supabase/MIGRATION_README.md`** (NEW FILE)
- Documents the issue and solution
- Provides step-by-step migration instructions
- Includes verification SQL queries
- Explains what changed and why

### Migration Required
To apply this fix to an existing Supabase database:
1. Go to Supabase SQL Editor
2. Run the contents of `supabase/add_upvotes.sql`
3. Verify with the queries in `MIGRATION_README.md`

### Files Modified
1. `supabase/schema.sql`

### Files Created
1. `supabase/add_upvotes.sql`
2. `supabase/MIGRATION_README.md`

---

## Summary of All Changes

### Bug Fixes
- Fixed syntax error causing homepage crash (extra closing brace)
- Fixed upvote count not updating in UI (added callback pattern)
- Fixed upvote count not persisting in database (added schema migration)

### Features Added
- Support for both deaths and serious injuries with multiple victims
- Automatic geocoding using Nominatim API
- Evidence links input in report form
- Complete upvote functionality (UI + backend)

### Database Changes Required
If you have an existing Supabase database, run these migrations in order:
1. Outcome type migration (from Change 1)
2. Upvote functionality migration (from Change 6 - `add_upvotes.sql`)

### Files Summary
**Modified:** 11 files
**Created:** 2 files
**Total:** 13 files changed
