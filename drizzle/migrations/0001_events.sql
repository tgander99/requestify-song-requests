create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique default substr(replace(gen_random_uuid()::text,'-',''),1,10),
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.events (owner_id, created_at desc);
grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "owner reads events" on public.events for select to authenticated using (owner_id = auth.uid());
create policy "dj creates events" on public.events for insert to authenticated
  with check (owner_id = auth.uid() and public.has_role(auth.uid(),'admin'));
create policy "owner updates events" on public.events for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner deletes events" on public.events for delete to authenticated using (owner_id = auth.uid());

alter table public.song_requests add column event_id uuid references public.events(id) on delete cascade;
create index on public.song_requests (event_id, created_at);

create or replace function public.owns_event(_event_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.events where id = _event_id and owner_id = auth.uid())
$$;

drop policy "admins read" on public.song_requests;
drop policy "admins update" on public.song_requests;
drop policy "admins delete" on public.song_requests;
create policy "event owner reads" on public.song_requests for select to authenticated
  using (public.owns_event(event_id) or (event_id is null and public.has_role(auth.uid(),'admin')));
create policy "event owner updates" on public.song_requests for update to authenticated
  using (public.owns_event(event_id) or (event_id is null and public.has_role(auth.uid(),'admin')))
  with check (public.owns_event(event_id) or (event_id is null and public.has_role(auth.uid(),'admin')));
create policy "event owner deletes" on public.song_requests for delete to authenticated
  using (public.owns_event(event_id) or (event_id is null and public.has_role(auth.uid(),'admin')));