create type public.app_role as enum ('admin');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- First account ever created becomes the DJ admin.
create or replace function public.handle_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.handle_first_admin();

create type public.request_status as enum ('pending','approved','rejected','played');
create table public.song_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  artist text not null check (char_length(artist) between 1 and 120),
  guest_name text check (guest_name is null or char_length(guest_name) <= 60),
  message text check (message is null or char_length(message) <= 280),
  status public.request_status not null default 'pending',
  normalized_key text not null,
  client_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.song_requests (created_at desc);
create index on public.song_requests (client_hash, created_at desc);
create index on public.song_requests (normalized_key);
grant select, update, delete on public.song_requests to authenticated;
grant all on public.song_requests to service_role;
alter table public.song_requests enable row level security;
create policy "admins read" on public.song_requests for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins update" on public.song_requests for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admins delete" on public.song_requests for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger song_requests_touch before update on public.song_requests for each row execute function public.touch_updated_at();

alter publication supabase_realtime add table public.song_requests;