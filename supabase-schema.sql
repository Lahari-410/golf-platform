-- ============================================================
-- GOLF CHARITY PLATFORM — SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- USERS TABLE (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  role text default 'subscriber', -- 'subscriber' or 'admin'
  subscription_status text default 'inactive', -- 'active', 'inactive', 'cancelled'
  subscription_plan text, -- 'monthly' or 'yearly'
  subscription_end_date timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  charity_id uuid, -- selected charity
  charity_percentage integer default 10, -- % of subscription going to charity
  created_at timestamptz default now()
);

-- SCORES TABLE
create table public.scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  score integer not null check (score >= 1 and score <= 45), -- Stableford format
  played_at date not null,
  created_at timestamptz default now()
);

-- CHARITIES TABLE
create table public.charities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  image_url text,
  website text,
  is_featured boolean default false,
  is_active boolean default true,
  total_received numeric default 0,
  created_at timestamptz default now()
);

-- DRAWS TABLE
create table public.draws (
  id uuid default gen_random_uuid() primary key,
  draw_date date not null,
  status text default 'pending', -- 'pending', 'simulated', 'published'
  draw_type text default 'random', -- 'random' or 'algorithmic'
  winning_numbers integer[] not null, -- array of 5 numbers
  jackpot_amount numeric default 0,
  four_match_amount numeric default 0,
  three_match_amount numeric default 0,
  jackpot_rolled_over boolean default false,
  total_pool numeric default 0,
  created_at timestamptz default now()
);

-- DRAW ENTRIES TABLE (which users entered which draw)
create table public.draw_entries (
  id uuid default gen_random_uuid() primary key,
  draw_id uuid references public.draws(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  numbers_matched integer default 0, -- 0, 3, 4, or 5
  prize_amount numeric default 0,
  created_at timestamptz default now()
);

-- WINNERS TABLE
create table public.winners (
  id uuid default gen_random_uuid() primary key,
  draw_id uuid references public.draws(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_type text not null, -- '5-match', '4-match', '3-match'
  prize_amount numeric not null,
  proof_url text, -- screenshot upload
  verification_status text default 'pending', -- 'pending', 'approved', 'rejected'
  payment_status text default 'pending', -- 'pending', 'paid'
  created_at timestamptz default now()
);

-- CHARITY CONTRIBUTIONS TABLE
create table public.charity_contributions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  charity_id uuid references public.charities(id) on delete cascade not null,
  amount numeric not null,
  contribution_date date not null,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — controls who can read/write what
-- ============================================================

alter table public.profiles enable row level security;
alter table public.scores enable row level security;
alter table public.charities enable row level security;
alter table public.draws enable row level security;
alter table public.draw_entries enable row level security;
alter table public.winners enable row level security;
alter table public.charity_contributions enable row level security;

-- Profiles: users can only see/edit their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Scores: users can only see/edit their own scores
create policy "Users can view own scores" on public.scores for select using (auth.uid() = user_id);
create policy "Users can insert own scores" on public.scores for insert with check (auth.uid() = user_id);
create policy "Users can delete own scores" on public.scores for delete using (auth.uid() = user_id);

-- Charities: everyone can read
create policy "Anyone can view charities" on public.charities for select using (true);

-- Draws: everyone can read published draws
create policy "Anyone can view published draws" on public.draws for select using (status = 'published');

-- Draw entries: users can see their own entries
create policy "Users can view own entries" on public.draw_entries for select using (auth.uid() = user_id);

-- Winners: users can see their own wins
create policy "Users can view own wins" on public.winners for select using (auth.uid() = user_id);

-- ============================================================
-- SEED DATA — insert some charities to start with
-- ============================================================

insert into public.charities (name, description, is_featured, is_active) values
('Golf Foundation', 'Supporting young golfers from disadvantaged backgrounds to access the sport.', true, true),
('Cancer Research UK', 'Funding life-saving cancer research across the UK.', false, true),
('Macmillan Cancer Support', 'Providing specialist health care, information and financial support to people affected by cancer.', false, true),
('British Heart Foundation', 'Funding research into heart and circulatory diseases.', true, true),
('Age UK', 'Supporting older people to live well and independently.', false, true);

-- ============================================================
-- FUNCTION: auto-create profile when user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
