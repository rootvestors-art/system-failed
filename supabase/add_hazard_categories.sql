-- ============================================
-- Migration: widen the negligence_type vocabulary
--
-- Why: with only five categories, reports that did not fit were forced into the
-- nearest one. "No street lights at night" was classified as Electrocution and
-- routed to the electricity utility, when street lighting is the municipal
-- body's responsibility. These five additions give the common cases a home.
--
-- Run this in the Supabase SQL editor against an existing database.
-- Safe to re-run: it drops the old constraint before adding the new one.
-- ============================================

alter table public.incidents
  drop constraint if exists incidents_negligence_type_check;

alter table public.incidents
  add constraint incidents_negligence_type_check check (
    negligence_type in (
      'Pothole', 'Open_Drain', 'Electrocution', 'Collapse', 'Open_Pit',
      'Street_Light', 'Road_Design', 'Broken_Footpath', 'Waterlogging', 'Debris',
      'Dangerous_Structure', 'Garbage_Waste', 'Water_Leak'
    )
  );

alter table public.hazards
  drop constraint if exists hazards_negligence_type_check;

alter table public.hazards
  add constraint hazards_negligence_type_check check (
    negligence_type in (
      'Pothole', 'Open_Drain', 'Electrocution', 'Collapse', 'Open_Pit',
      'Street_Light', 'Road_Design', 'Broken_Footpath', 'Waterlogging', 'Debris',
      'Dangerous_Structure', 'Garbage_Waste', 'Water_Leak'
    )
  );

-- Verify:
--   select distinct negligence_type from public.hazards;
