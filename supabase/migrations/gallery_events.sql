-- Gallery Events table for SAAHS Event Gallery
-- Run this in Supabase SQL Editor

create table if not exists gallery_events (
  id bigint generated always as identity primary key,
  title text not null,
  event_date date not null,
  category text not null check (category in ('Academic', 'Cultural', 'Sports', 'Welfare', 'Conventions')),
  location text not null,
  description text not null default '',
  cover_image_url text not null default '',
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table gallery_events enable row level security;

-- Public read
create policy "Public can read gallery events"
  on gallery_events for select
  using (true);

-- Admin write (service role bypasses RLS automatically)
