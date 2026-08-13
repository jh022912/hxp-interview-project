-- Run this once in the Supabase SQL editor for the project referenced by
-- SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.

create extension if not exists pgcrypto;

create table if not exists trip_signups (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null,
  full_name text not null,
  email text not null,
  phone text not null,
  emergency_contact_name text not null,
  emergency_contact_phone text not null,
  dietary_restrictions text,
  reason text not null,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security is enabled with NO policies defined. That means only
-- Supabase's service-role key can read or write this table — the anon/public
-- key (or a leaked frontend bundle) has zero access, by default, forever.
alter table trip_signups enable row level security;

-- Supports the rate-limit lookup in Backend/lib/rateLimit.ts
create index if not exists trip_signups_ip_hash_created_at_idx
  on trip_signups (ip_hash, created_at desc);
