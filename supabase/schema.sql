-- ============================================
-- SystemFailed — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create the incidents table
create table if not exists public.incidents (
  id            uuid primary key default gen_random_uuid(),
  case_id       text not null,
  title         text not null,
  victims       jsonb not null,
  date_of_incident date not null,
  location      jsonb not null,
  negligence_type text not null check (
    negligence_type in ('Pothole', 'Open_Drain', 'Electrocution', 'Collapse', 'Open_Pit')
  ),
  responsible_entities jsonb not null,
  status        text not null default 'Community_Flagged' check (
    status in ('Verified', 'Community_Flagged', 'Official_Denial')
  ),
  evidence_links text[] default '{}',
  description   text not null,
  image_url     text,
  upvote_count  integer not null default 0 check (upvote_count >= 0),
  created_at    timestamptz not null default now()
);

-- 2. Index for fast queries
create index if not exists idx_incidents_created_at on public.incidents (created_at desc);
create index if not exists idx_incidents_status on public.incidents (status);
create index if not exists idx_incidents_negligence_type on public.incidents (negligence_type);
create index if not exists idx_incidents_upvote_count on public.incidents (upvote_count desc);

-- 3. Enable Row Level Security
alter table public.incidents enable row level security;

-- Anyone can read incidents (public data)
create policy "Incidents are publicly readable"
  on public.incidents for select
  using (true);

-- Anyone can insert incidents (anonymous reporting)
create policy "Anyone can report an incident"
  on public.incidents for insert
  with check (true);

-- 4. Create storage bucket for evidence photos
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do nothing;

-- Allow public read access to evidence photos
create policy "Evidence photos are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'evidence');

-- Allow anonymous uploads to evidence bucket
create policy "Anyone can upload evidence photos"
  on storage.objects for insert
  with check (bucket_id = 'evidence');

-- ============================================
-- 5. Hazards table (preventive reporting)
-- ============================================

create table if not exists public.hazards (
  id              uuid primary key default gen_random_uuid(),
  location        jsonb not null,
  negligence_type text not null check (
    negligence_type in ('Pothole', 'Open_Drain', 'Electrocution', 'Collapse', 'Open_Pit')
  ),
  severity        text not null default 'Medium' check (
    severity in ('Low', 'Medium', 'High', 'Critical')
  ),
  description     text not null,
  image_url       text,
  evidence_links  text[] default '{}',
  status          text not null default 'Reported' check (
    status in ('Reported', 'Verified', 'Fixed')
  ),
  reported_by     text,
  upvote_count    integer not null default 0 check (upvote_count >= 0),
  created_at      timestamptz not null default now()
);

-- Indexes for hazards
create index if not exists idx_hazards_created_at on public.hazards (created_at desc);
create index if not exists idx_hazards_status on public.hazards (status);
create index if not exists idx_hazards_severity on public.hazards (severity);
create index if not exists idx_hazards_upvote_count on public.hazards (upvote_count desc);

-- Enable RLS for hazards
alter table public.hazards enable row level security;

create policy "Hazards are publicly readable"
  on public.hazards for select
  using (true);

create policy "Anyone can report a hazard"
  on public.hazards for insert
  with check (true);

-- ============================================
-- 7. Upvote functionality
-- ============================================

-- Create RPC function to increment incident upvote count atomically
create or replace function increment_upvote(incident_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  update public.incidents
  set upvote_count = upvote_count + 1
  where id = incident_id
  returning upvote_count into new_count;
  
  return new_count;
end;
$$;

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

-- 8. Seed incidents
insert into public.incidents (
  case_id, title, victims, date_of_incident, location, negligence_type,
  responsible_entities, status, evidence_links,
  description, image_url
) values (
  'DL-2026-001',
  'Bank Manager Falls Into Uncovered DJB Pit',
  '[{"name": "Kamal Dhyani", "age": 25, "occupation": "HDFC Bank Assistant Manager", "outcome": "Death"}]'::jsonb,
  '2026-02-06',
  '{"lat": 28.6303, "lng": 77.0825, "address": "Near Andhra School, Joginder Singh Marg", "city": "Janakpuri, Delhi", "state": "Delhi"}'::jsonb,
  'Open_Pit',
  '{"agency": "Delhi Jal Board (DJB)", "ward": "Janakpuri Ward", "mla": "Unknown", "mp": "Unknown", "cm": "Chief Minister, Delhi"}'::jsonb,
  'Verified',
  ARRAY[
    'https://www.ndtv.com/delhi-news/delhi-man-falls-into-15-foot-pit-dug-by-jal-board-dies-7670389',
    'https://timesofindia.indiatimes.com/city/delhi/25-year-old-banker-falls-into-15-foot-deep-djb-pit-in-delhis-janakpuri-dies/articleshow/128003498.cms'
  ],
  'A 25-year-old HDFC Bank Assistant Manager fell into a 15-foot deep pit dug by the Delhi Jal Board (DJB) for construction work near Andhra School on Joginder Singh Marg in Janakpuri. The pit had no barricades, warning signs, or lighting. He was returning home at night when he fell in. He was pulled out and rushed to DDU Hospital but was declared dead on arrival.',
  null
),
(
  'DL-2026-002',
  'Biker Dies in Open DJB Pit, Police Argue Over Jurisdiction',
  '[{"name": "Abhishek", "age": 28, "occupation": "Private Employee", "outcome": "Death"}]'::jsonb,
  '2026-02-05',
  '{"lat": 28.6480, "lng": 77.2506, "address": "Shanti Van Area", "city": "Delhi", "state": "Delhi"}'::jsonb,
  'Open_Pit',
  '{"agency": "Delhi Jal Board (DJB)", "ward": "Civil Lines Ward", "mla": "Unknown", "mp": "Unknown", "cm": "Chief Minister, Delhi"}'::jsonb,
  'Verified',
  ARRAY[
    'https://timesofindia.indiatimes.com/city/delhi/after-noida-techies-death-delhi-biker-falls-into-pit-dies-family-spent-night-shuttling-between-police-stations/articleshow/127973494.cms'
  ],
  'Biker fell into an open Delhi Jal Board pit left without signage near Shanti Van. While the victim lay dying, police from two stations argued over jurisdiction. The family spent the night shuttling between stations instead of grieving.',
  null
),
(
  'KA-2026-015',
  'Two-Wheeler Rider Killed After Hitting Pothole',
  '[{"age": 45, "outcome": "Death"}]'::jsonb,
  '2026-02-04',
  '{"lat": 12.9566, "lng": 77.7010, "address": "Outer Ring Road, Marathahalli", "city": "Bengaluru", "state": "Karnataka"}'::jsonb,
  'Pothole',
  '{"agency": "BBMP (Bruhat Bengaluru Mahanagara Palike)", "ward": "Marathahalli Ward"}'::jsonb,
  'Community_Flagged',
  '{}',
  'Two-wheeler rider lost control after hitting a large pothole on the Outer Ring Road. No street lighting in the area. BBMP had been notified about the pothole weeks earlier.',
  null
);
