-- ============================================================
-- EcoReport Pro V5 - Supabase setup
-- Ejecuta este archivo COMPLETO en SQL Editor.
-- El bucket "reports" debe existir y permanecer PRIVADO.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- REPORTS: campos necesarios para QR + PDF en Storage
-- ------------------------------------------------------------
alter table public.reports
  add column if not exists public_token text;

alter table public.reports
  add column if not exists public_download_enabled boolean not null default true;

alter table public.reports
  add column if not exists pdf_storage_path text;

update public.reports
set public_token = 'ER-' || upper(encode(gen_random_bytes(18), 'hex'))
where public_token is null;

alter table public.reports
  alter column public_token set default ('ER-' || upper(encode(gen_random_bytes(18), 'hex')));

create unique index if not exists reports_public_token_uidx
  on public.reports(public_token);

create index if not exists reports_pdf_storage_path_idx
  on public.reports(pdf_storage_path)
  where pdf_storage_path is not null;

-- ------------------------------------------------------------
-- ACCESS LOG
-- ------------------------------------------------------------
create table if not exists public.report_access_log (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade not null,
  accessed_at timestamptz not null default now(),
  access_type text not null default 'qr_download'
);

alter table public.report_access_log enable row level security;

drop policy if exists report_access_log_clinic_access on public.report_access_log;
create policy report_access_log_clinic_access
on public.report_access_log
for all to authenticated
using (
  exists (
    select 1
    from public.reports r
    where r.id = report_access_log.report_id
      and public.is_clinic_member(r.clinic_id)
  )
)
with check (
  exists (
    select 1
    from public.reports r
    where r.id = report_access_log.report_id
      and public.is_clinic_member(r.clinic_id)
  )
);

-- ------------------------------------------------------------
-- STORAGE POLICIES
-- Path esperado: <clinic_id>/<report_id>.pdf
-- El bucket reports debe ser PRIVADO.
-- ------------------------------------------------------------

drop policy if exists "EcoReport reports insert" on storage.objects;
drop policy if exists "EcoReport reports select" on storage.objects;
drop policy if exists "EcoReport reports update" on storage.objects;
drop policy if exists "EcoReport reports delete" on storage.objects;

create policy "EcoReport reports insert"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'reports'
  and (storage.foldername(name))[1] is not null
  and public.is_clinic_member(((storage.foldername(name))[1])::uuid)
);

create policy "EcoReport reports select"
on storage.objects
for select to authenticated
using (
  bucket_id = 'reports'
  and (storage.foldername(name))[1] is not null
  and public.is_clinic_member(((storage.foldername(name))[1])::uuid)
);

create policy "EcoReport reports update"
on storage.objects
for update to authenticated
using (
  bucket_id = 'reports'
  and (storage.foldername(name))[1] is not null
  and public.is_clinic_member(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'reports'
  and (storage.foldername(name))[1] is not null
  and public.is_clinic_member(((storage.foldername(name))[1])::uuid)
);

create policy "EcoReport reports delete"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'reports'
  and (storage.foldername(name))[1] is not null
  and public.is_clinic_member(((storage.foldername(name))[1])::uuid)
);

-- ------------------------------------------------------------
-- ONBOARDING: crea una clínica para el usuario autenticado.
-- Es útil para la primera instalación. Después puedes administrar
-- clínicas/membresías con tus propias reglas de producción.
-- ------------------------------------------------------------
create or replace function public.create_my_clinic(
  clinic_name text,
  clinic_address text default null,
  clinic_phone text default null,
  sonographer_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_clinic_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  insert into public.clinics(name, address, phone)
  values (
    coalesce(nullif(trim(clinic_name), ''), 'Mi clínica'),
    nullif(trim(clinic_address), ''),
    nullif(trim(clinic_phone), '')
  )
  returning id into new_clinic_id;

  insert into public.clinic_members(clinic_id, user_id, role)
  values (new_clinic_id, auth.uid(), 'admin');

  if nullif(trim(coalesce(sonographer_name, '')), '') is not null then
    insert into public.sonographers(clinic_id, user_id, full_name)
    values (new_clinic_id, auth.uid(), trim(sonographer_name));
  end if;

  return new_clinic_id;
end;
$$;

revoke all on function public.create_my_clinic(text,text,text,text) from public;
grant execute on function public.create_my_clinic(text,text,text,text) to authenticated;

-- ------------------------------------------------------------
-- CONSTRAINT ÚTIL PARA EVITAR PACIENTES DUPLICADOS POR ID
-- Solo se crea si no existe un índice equivalente.
-- ------------------------------------------------------------
create unique index if not exists patients_clinic_identifier_uidx
on public.patients(clinic_id, patient_identifier)
where patient_identifier is not null and patient_identifier <> '';
