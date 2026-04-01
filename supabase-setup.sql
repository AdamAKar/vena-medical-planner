-- Run this in Supabase SQL Editor
create table if not exists zoho_acct_cache (
  zoho_id     text primary key,
  name        text not null default '',
  city        text default '',
  modified_at timestamptz default now()
);

alter table zoho_acct_cache disable row level security;
create index if not exists idx_zoho_acct_name on zoho_acct_cache (lower(name));
grant select, insert, update, delete on zoho_acct_cache to anon;

-- Add missing columns to reps table for Zoho credentials
alter table reps add column if not exists zoho_client_id text;
alter table reps add column if not exists zoho_client_secret text;
