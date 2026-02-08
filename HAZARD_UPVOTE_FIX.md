# Hazard Upvote Fix Summary

## Problem
Hazard upvotes were failing and not persisting after page reload, while incident upvotes worked perfectly.

## Root Cause
The database schema was missing hazard upvote support:
1. ❌ `upvote_count` column missing in `hazards` table
2. ❌ `increment_hazard_upvote()` RPC function missing
3. ✅ Frontend code was already correct (calling the RPC function)
4. ✅ TypeScript types already had `upvote_count: number`
5. ✅ Seed data already had `upvote_count` initialized

## Solution Applied

### Files Updated

1. **`supabase/schema.sql`**
   - Added `upvote_count integer not null default 0` to hazards table
   - Added index `idx_hazards_upvote_count` for efficient sorting
   - Added `increment_hazard_upvote(hazard_id uuid)` RPC function

2. **`supabase/add_upvotes.sql`** (migration file)
   - Added hazard upvote column migration
   - Added hazard upvote index
   - Added `increment_hazard_upvote()` RPC function

3. **`supabase/MIGRATION_README.md`**
   - Updated to document both incidents and hazards
   - Added verification queries for hazards
   - Updated "What Changed" section

## How to Fix in Your Database

Run this in your Supabase SQL Editor:

```sql
-- Add upvote_count column to hazards table
alter table public.hazards 
add column if not exists upvote_count integer not null default 0 check (upvote_count >= 0);

-- Create index for sorting by upvotes
create index if not exists idx_hazards_upvote_count on public.hazards (upvote_count desc);

-- Create RPC function to increment hazard upvote count atomically
create or replace function increment_hazard_upvote(hazard_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  update public.hazards
  set upvote_count = upvote_count + 1
  where id = hazard_id
  returning upvote_count into new_count;
  
  return new_count;
end;
$$;
```

## Verification

After running the migration:

```sql
-- Check column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'hazards' AND column_name = 'upvote_count';

-- Check function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'increment_hazard_upvote';

-- Test with a real hazard ID
SELECT increment_hazard_upvote('<your-hazard-id>');
```

## Result
Once the migration is applied, hazard upvotes will work exactly like incident upvotes:
- ✅ Upvotes persist in database
- ✅ Counts survive page reloads
- ✅ Atomic updates prevent race conditions
- ✅ UI updates immediately after upvoting
