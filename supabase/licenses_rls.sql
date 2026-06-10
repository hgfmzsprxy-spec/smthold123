alter table public.licenses
  add column if not exists app_name text,
  add column if not exists app_version text,
  add column if not exists app_webhook text,
  add column if not exists app_sessions_paused boolean not null default false,
  add column if not exists app_sessions_paused_at timestamptz,
  add column if not exists discord_auth_user_id uuid,
  add column if not exists discord_user_id text,
  add column if not exists discord_username text,
  add column if not exists discord_avatar_url text,
  add column if not exists discord_connected_at timestamptz,
  add column if not exists vouch_bonus_hours integer not null default 0,
  add column if not exists vouch_bonus_claimed_at timestamptz,
  add column if not exists frozen_remaining_ms bigint,
  add column if not exists ban_restore_status text;

alter table public.applications
  add column if not exists sessions_paused boolean not null default false,
  add column if not exists sessions_paused_at timestamptz,
  add column if not exists download_file_name text,
  add column if not exists download_file_url text,
  add column if not exists download_file_path text,
  add column if not exists download_file_size bigint,
  add column if not exists download_file_type text,
  add column if not exists download_uploaded_at timestamptz;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'application-downloads',
  'application-downloads',
  true,
  1073741824,
  array[
    'application/octet-stream',
    'application/x-msdownload',
    'application/x-rar-compressed',
    'application/vnd.rar'
  ]::text[]
where not exists (
  select 1
  from storage.buckets
  where id = 'application-downloads'
);

update public.licenses as l
set
  app_name = coalesce(l.app_name, a.name),
  app_version = coalesce(l.app_version, a.version),
  app_webhook = coalesce(l.app_webhook, a.webhook),
  app_sessions_paused = a.sessions_paused,
  app_sessions_paused_at = a.sessions_paused_at
from public.applications as a
where
  (l.application_id is not null and l.application_id::text = a.id::text)
  or (coalesce(l.app_id, '') <> '' and l.app_id = a.app_id);

alter table public.licenses enable row level security;
alter table public.applications enable row level security;

drop policy if exists "licenses_select_anon_by_key" on public.licenses;
drop policy if exists "licenses_update_anon_activate_once" on public.licenses;
drop policy if exists "licenses_update_anon_bind_hwid" on public.licenses;
drop policy if exists "licenses_update_anon_bind_discord" on public.licenses;
drop policy if exists "licenses_all_authenticated" on public.licenses;
drop policy if exists "applications_select_anon_by_app_id" on public.applications;
drop policy if exists "applications_all_authenticated" on public.applications;
drop policy if exists "application_downloads_public_read" on storage.objects;
drop policy if exists "application_downloads_authenticated_insert" on storage.objects;
drop policy if exists "application_downloads_authenticated_update" on storage.objects;
drop policy if exists "application_downloads_authenticated_delete" on storage.objects;

create policy "licenses_select_anon_by_key"
on public.licenses
for select
to anon
using (
  license_key = (current_setting('request.headers', true)::json->>'x-license-key')
  and (
    app_id = (current_setting('request.headers', true)::json->>'x-app-id')
    or application_id::text = (current_setting('request.headers', true)::json->>'x-app-id')
  )
);

create policy "licenses_update_anon_activate_once"
on public.licenses
for update
to anon
using (
  activated_at is null
  and coalesce(status, '') in ('', 'Not Activated')
  and app_sessions_paused is not true
  and license_key = (current_setting('request.headers', true)::json->>'x-license-key')
  and (
    app_id = (current_setting('request.headers', true)::json->>'x-app-id')
    or application_id::text = (current_setting('request.headers', true)::json->>'x-app-id')
  )
)
with check (
  activated_at is not null
  and coalesce(status, '') = 'Activated'
  and hwid is not null
  and license_key = (current_setting('request.headers', true)::json->>'x-license-key')
  and (
    app_id = (current_setting('request.headers', true)::json->>'x-app-id')
    or application_id::text = (current_setting('request.headers', true)::json->>'x-app-id')
  )
);

create policy "licenses_update_anon_bind_hwid"
on public.licenses
for update
to anon
using (
  activated_at is not null
  and hwid is null
  and coalesce(status, '') = 'Activated'
  and app_sessions_paused is not true
  and license_key = (current_setting('request.headers', true)::json->>'x-license-key')
  and (
    app_id = (current_setting('request.headers', true)::json->>'x-app-id')
    or application_id::text = (current_setting('request.headers', true)::json->>'x-app-id')
  )
)
with check (
  activated_at is not null
  and hwid is not null
  and coalesce(status, '') = 'Activated'
  and license_key = (current_setting('request.headers', true)::json->>'x-license-key')
  and (
    app_id = (current_setting('request.headers', true)::json->>'x-app-id')
    or application_id::text = (current_setting('request.headers', true)::json->>'x-app-id')
  )
);

create policy "licenses_update_anon_bind_discord"
on public.licenses
for update
to anon
using (
  activated_at is null
  and hwid is null
  and coalesce(status, '') in ('', 'Not Activated')
  and coalesce(discord_auth_user_id::text, '') = ''
  and license_key = (current_setting('request.headers', true)::json->>'x-license-key')
  and (
    app_id = (current_setting('request.headers', true)::json->>'x-app-id')
    or application_id::text = (current_setting('request.headers', true)::json->>'x-app-id')
  )
)
with check (
  activated_at is null
  and hwid is null
  and coalesce(status, '') in ('', 'Not Activated')
  and coalesce(discord_auth_user_id::text, '') <> ''
  and coalesce(discord_user_id, '') <> ''
  and coalesce(discord_username, '') <> ''
  and license_key = (current_setting('request.headers', true)::json->>'x-license-key')
  and (
    app_id = (current_setting('request.headers', true)::json->>'x-app-id')
    or application_id::text = (current_setting('request.headers', true)::json->>'x-app-id')
  )
);

create policy "licenses_all_authenticated"
on public.licenses
for all
to authenticated
using (true)
with check (true);

create policy "applications_select_anon_by_app_id"
on public.applications
for select
to anon
using (
  app_id = (current_setting('request.headers', true)::json->>'x-app-id')
  or id::text = (current_setting('request.headers', true)::json->>'x-app-id')
);

create policy "applications_all_authenticated"
on public.applications
for all
to authenticated
using (true)
with check (true);

create policy "application_downloads_public_read"
on storage.objects
for select
to public
using (bucket_id = 'application-downloads');

create policy "application_downloads_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'application-downloads');

create policy "application_downloads_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'application-downloads')
with check (bucket_id = 'application-downloads');

create policy "application_downloads_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'application-downloads');
