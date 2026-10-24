-- Exécuter dans Supabase > SQL Editor. Ne pas exposer la clé service_role.
create extension if not exists pgcrypto;
create table if not exists public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade);
create table if not exists public.rides (
 id uuid primary key default gen_random_uuid(), slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
 title text not null, ride_date date not null, start_time time, meeting_point text,
 distance_km numeric(7,1), pace text, pace_2 text, difficulty text, description text,
 rwgps_route_id text check (rwgps_route_id is null or rwgps_route_id ~ '^[0-9]+$'),
 image_url text, status text not null default 'draft' check(status in ('draft','published','cancelled')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.photos (id uuid primary key default gen_random_uuid(), image_url text not null, caption text, created_at timestamptz not null default now());
create table if not exists public.site_settings (id int primary key check(id=1), contact_email text, about_text text);
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at=now(); return new; end $$;
create trigger rides_updated_at before update on public.rides for each row execute function public.touch_updated_at();
create or replace function public.is_club_admin() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.admin_users where user_id=(select auth.uid())) $$;
revoke all on function public.is_club_admin() from public;
grant execute on function public.is_club_admin() to authenticated, anon;
alter table public.admin_users enable row level security;
alter table public.rides enable row level security;
alter table public.photos enable row level security;
alter table public.site_settings enable row level security;
create policy "admin can see own membership" on public.admin_users for select to authenticated using(user_id=(select auth.uid()));
create policy "public sees published rides" on public.rides for select to anon,authenticated using(status='published' or (select public.is_club_admin()));
create policy "admin creates rides" on public.rides for insert to authenticated with check ((select public.is_club_admin()));
create policy "admin edits rides" on public.rides for update to authenticated using ((select public.is_club_admin())) with check ((select public.is_club_admin()));
create policy "admin deletes rides" on public.rides for delete to authenticated using ((select public.is_club_admin()));
create policy "public sees photos" on public.photos for select to anon,authenticated using(true);
create policy "admin adds photos" on public.photos for insert to authenticated with check ((select public.is_club_admin()));
create policy "admin deletes photos" on public.photos for delete to authenticated using ((select public.is_club_admin()));
create policy "public sees settings" on public.site_settings for select to anon,authenticated using(true);
create policy "admin inserts settings" on public.site_settings for insert to authenticated with check ((select public.is_club_admin()));
create policy "admin updates settings" on public.site_settings for update to authenticated using ((select public.is_club_admin())) with check ((select public.is_club_admin()));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('club-photos','club-photos',true,8388608,array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;
create policy "public reads club photos" on storage.objects for select to anon,authenticated using(bucket_id='club-photos');
create policy "admins delete club photos" on storage.objects for delete to authenticated using(bucket_id='club-photos' and (select public.is_club_admin()));
create policy "admins upload club photos" on storage.objects for insert to authenticated with check(bucket_id='club-photos' and (select public.is_club_admin()));
insert into public.rides(slug,title,ride_date,description,rwgps_route_id,image_url,status) values
 ('oka-2027','Oka','2027-05-15','Direction Oka pour une sortie de groupe. Heure et point de rencontre à confirmer.','57071272','/assets/archive-velo-v2.jpg','published'),
 ('mascouche-2027','Mascouche','2027-05-24','Une sortie vers Mascouche. Heure et point de rencontre à confirmer.','55340222','/assets/club-groupe.jpg','published'),
 ('laval-est-2027','Laval Est','2027-06-02','Cap sur l’est de Laval. Heure et point de rencontre à confirmer.','55340222','/assets/archive-duo-v2.jpg','published')
on conflict (slug) do nothing;
insert into public.site_settings(id,contact_email,about_text) values(1,'francois@latelierducontenu.com','Le club cycliste de l’Est de Montréal. On part de Tétreaultville, mais on roule partout : sur la route, en gravel, en ville comme en campagne. Pour le plaisir, l’entraînement et la gang.') on conflict (id) do nothing;
-- IMPORTANT : après création du compte dans Authentication > Users, exécuter :
-- insert into public.admin_users(user_id) values ('UUID_DU_COMPTE_ADMIN');
