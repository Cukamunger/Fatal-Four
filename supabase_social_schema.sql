-- Fatal Four social/profile schema
-- Run this once in Supabase SQL Editor before enabling the real social features.

create table if not exists public.follows (
  follower_id uuid references auth.users(id) on delete cascade,
  following_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.bubble_likes (
  bubble_id uuid references public.bubbles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (bubble_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) on delete cascade not null,
  recipient_id uuid references auth.users(id) on delete cascade not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz default now(),
  check (sender_id <> recipient_id)
);

alter table public.follows enable row level security;
alter table public.bubble_likes enable row level security;
alter table public.messages enable row level security;

create policy "Users can read follows" on public.follows for select to authenticated using (true);
create policy "Users can follow or unfollow" on public.follows for insert to authenticated with check (auth.uid() = follower_id);
create policy "Users can remove their follows" on public.follows for delete to authenticated using (auth.uid() = follower_id);

create policy "Users can read likes" on public.bubble_likes for select to authenticated using (true);
create policy "Users can like bubbles" on public.bubble_likes for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can remove their likes" on public.bubble_likes for delete to authenticated using (auth.uid() = user_id);

create policy "Users can read their messages" on public.messages for select to authenticated using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "Users can send messages" on public.messages for insert to authenticated with check (auth.uid() = sender_id);

-- Avatar uploads. Create a public bucket named "avatars" if it does not already exist.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Users can upload their own avatar" on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar" on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Public avatars are viewable" on storage.objects
for select using (bucket_id = 'avatars');
