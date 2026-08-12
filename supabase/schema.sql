-- Fatal Four 2026-27 production data model
-- IMPORTANT: kickoff locking is enforced server-side. Never trust client clock/state.

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24),
  avatar_url text,
  avatar_team_id text,
  created_at timestamptz not null default now()
);

create table if not exists seasons (
  id text primary key,
  name text not null,
  kickoff_at timestamptz not null,
  locked_at timestamptz,
  status text not null default 'open' check (status in ('open','locked','complete'))
);

insert into seasons(id,name,kickoff_at)
values ('2026-27','Fatal Four 2026-27','2026-08-29T16:00:00Z')
on conflict (id) do update set kickoff_at=excluded.kickoff_at;

create table if not exists teams (
  id text primary key,
  name text not null,
  abbreviation text,
  conference text,
  logo_url text not null
);

create table if not exists bubbles (
  id uuid primary key default gen_random_uuid(),
  season_id text not null references seasons(id),
  user_id uuid not null references profiles(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  locked_at timestamptz,
  unique(season_id,user_id)
);

create table if not exists bubble_teams (
  bubble_id uuid not null references bubbles(id) on delete cascade,
  team_id text not null references teams(id),
  primary key (bubble_id,team_id)
);

create table if not exists ap_poll_weeks (
  season_id text not null references seasons(id),
  week integer not null,
  published_at timestamptz not null,
  primary key(season_id,week)
);

create table if not exists ap_poll_entries (
  season_id text not null,
  week integer not null,
  team_id text not null references teams(id),
  rank integer not null check(rank between 1 and 25),
  votes integer not null default 0,
  previous_rank integer,
  primary key(season_id,week,team_id),
  foreign key(season_id,week) references ap_poll_weeks(season_id,week) on delete cascade
);

create table if not exists follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(follower_id,following_id),
  check(follower_id <> following_id)
);

create table if not exists bubble_likes (
  user_id uuid not null references profiles(id) on delete cascade,
  bubble_id uuid not null references bubbles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,bubble_id)
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_a,user_b), check(user_a <> user_b)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null check(char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- Server-side lock helper. Any write path must call this function in a transaction.
create or replace function fatal_four_is_locked(p_season_id text)
returns boolean language sql stable as $$
  select now() >= kickoff_at from seasons where id=p_season_id;
$$;

-- The scoring/leaderboard is intentionally calculated from server-side data.
-- 'win_probability' is a model output: probability that the user's bubble contains
-- all four eventual semifinalists, based on current team semifinal probabilities.
create table if not exists bubble_live_scores (
  bubble_id uuid primary key references bubbles(id) on delete cascade,
  season_id text not null references seasons(id),
  win_probability numeric(6,3) not null default 0,
  rank integer,
  updated_at timestamptz not null default now()
);

-- Public leaderboard view. Individual bubbles are only publicly queryable after kickoff.
create or replace view public_bubble_leaderboard as
select p.username, p.avatar_url, b.id as bubble_id, b.season_id,
       bts.team_count, s.win_probability, s.rank, s.updated_at
from bubbles b
join profiles p on p.id=b.user_id
join lateral (select count(*)::int team_count from bubble_teams bt where bt.bubble_id=b.id) bts on true
left join bubble_live_scores s on s.bubble_id=b.id
where fatal_four_is_locked(b.season_id);
