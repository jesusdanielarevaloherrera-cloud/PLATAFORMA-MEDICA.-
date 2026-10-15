-- EcoReport Pro V5.8.8.11
-- Onboarding de clínicas + gestión de usuarios + copias/recuperación.
-- No elimina datos existentes.

create extension if not exists pgcrypto;

-- ============================================================
-- 1) MEMBRESÍAS: activar/desactivar acceso por clínica
-- ============================================================
alter table public.clinic_members
  add column if not exists active boolean not null default true;

create unique index if not exists clinic_members_clinic_user_uidx
  on public.clinic_members(clinic_id, user_id);

create index if not exists clinic_members_clinic_active_idx
  on public.clinic_members(clinic_id, active);

-- La pertenencia efectiva requiere que la membresía esté activa.
-- Se conserva el nombre original del parámetro para evitar conflictos 42P13.
create or replace function public.is_clinic_member(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_platform_owner()
    or exists (
      select 1
      from public.clinic_members cm
      join public.clinics c on c.id = cm.clinic_id
      where cm.clinic_id = target_clinic_id
        and cm.user_id = auth.uid()
        and coalesce(cm.active, true) = true
        and coalesce(c.access_enabled, true) = true
    );
$$;

revoke all on function public.is_clinic_member(uuid) from public;
grant execute on function public.is_clinic_member(uuid) to authenticated;


-- ============================================================
-- 1B) La app debe conocer si la membresía del usuario está activa.
-- ============================================================
drop function if exists public.get_my_clinics_access();

create or replace function public.get_my_clinics_access()
returns table(
  clinic_id uuid,
  name text,
  address text,
  phone text,
  role text,
  active boolean,
  access_enabled boolean,
  subscription_status text,
  access_changed_at timestamptz,
  access_reason text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.name,
    c.address,
    c.phone,
    cm.role::text,
    coalesce(cm.active,true),
    coalesce(c.access_enabled,true),
    coalesce(c.subscription_status,case when coalesce(c.access_enabled,true) then 'active' else 'suspended' end),
    c.access_changed_at,
    c.access_reason
  from public.clinic_members cm
  join public.clinics c on c.id=cm.clinic_id
  where cm.user_id=auth.uid()
  order by c.name;
$$;

revoke all on function public.get_my_clinics_access() from public;
grant execute on function public.get_my_clinics_access() to authenticated;

-- ============================================================
-- 2) GESTIÓN DE USUARIOS POR EL PROPIETARIO
-- ============================================================
create or replace function public.owner_list_clinic_members(p_clinic_id uuid)
returns table(
  user_id uuid,
  email text,
  role text,
  active boolean,
  member_created_at timestamptz,
  last_sign_in_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    cm.user_id,
    u.email,
    cm.role::text,
    coalesce(cm.active, true) as active,
    cm.created_at,
    u.last_sign_in_at
  from public.clinic_members cm
  left join auth.users u on u.id = cm.user_id
  where cm.clinic_id = p_clinic_id
    and public.is_platform_owner()
  order by coalesce(cm.active, true) desc, cm.role::text, u.email;
$$;

revoke all on function public.owner_list_clinic_members(uuid) from public;
grant execute on function public.owner_list_clinic_members(uuid) to authenticated;

create or replace function public.owner_set_clinic_member(
  p_clinic_id uuid,
  p_user_id uuid,
  p_role text default null,
  p_active boolean default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_active boolean;
  current_role text;
  active_admins integer;
begin
  if not public.is_platform_owner() then
    raise exception 'Solo el propietario puede administrar usuarios.';
  end if;

  select coalesce(active, true), role::text
    into current_active, current_role
  from public.clinic_members
  where clinic_id = p_clinic_id
    and user_id = p_user_id;

  if current_role is null then
    raise exception 'El usuario no pertenece a esta clínica.';
  end if;

  if p_user_id = auth.uid() and p_active = false then
    raise exception 'No puedes desactivar tu propio acceso de propietario.';
  end if;

  if p_active = false or (p_role is not null and lower(trim(p_role)) <> 'admin' and current_role = 'admin') then
    select count(*) into active_admins
    from public.clinic_members
    where clinic_id = p_clinic_id
      and role::text = 'admin'
      and coalesce(active, true) = true;
    if active_admins <= 1 and (p_active = false or lower(trim(coalesce(p_role, current_role))) <> 'admin') then
      raise exception 'La clínica debe conservar al menos un administrador activo.';
    end if;
  end if;

  update public.clinic_members
  set role = coalesce(nullif(trim(p_role), ''), role),
      active = coalesce(p_active, active, true)
  where clinic_id = p_clinic_id
    and user_id = p_user_id;

  return true;
end;
$$;

revoke all on function public.owner_set_clinic_member(uuid,uuid,text,boolean) from public;
grant execute on function public.owner_set_clinic_member(uuid,uuid,text,boolean) to authenticated;

create or replace function public.owner_remove_clinic_member(
  p_clinic_id uuid,
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  role_name text;
  active_admins integer;
begin
  if not public.is_platform_owner() then
    raise exception 'Solo el propietario puede quitar usuarios.';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'No puedes quitar tu propia cuenta de propietario.';
  end if;

  select role::text into role_name
  from public.clinic_members
  where clinic_id = p_clinic_id and user_id = p_user_id;
  if role_name is null then
    raise exception 'El usuario no pertenece a esta clínica.';
  end if;

  if role_name = 'admin' then
    select count(*) into active_admins
    from public.clinic_members
    where clinic_id = p_clinic_id
      and role::text = 'admin'
      and coalesce(active,true) = true;
    if active_admins <= 1 then
      raise exception 'La clínica debe conservar al menos un administrador activo.';
    end if;
  end if;

  delete from public.clinic_members
  where clinic_id = p_clinic_id and user_id = p_user_id;
  return true;
end;
$$;

revoke all on function public.owner_remove_clinic_member(uuid,uuid) from public;
grant execute on function public.owner_remove_clinic_member(uuid,uuid) to authenticated;

-- ============================================================
-- 3) COPIA DE SEGURIDAD DE UNA CLÍNICA
-- Incluye registros clínicos y rutas de archivos PDF.
-- Los archivos binarios se agregan al ZIP desde el frontend.
-- ============================================================
create or replace function public.owner_backup_clinic(p_clinic_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c jsonb;
  members jsonb;
  paths jsonb;
begin
  if not public.is_platform_owner() then
    raise exception 'Solo el propietario puede realizar copias.';
  end if;

  if not exists(select 1 from public.clinics where id = p_clinic_id) then
    raise exception 'La clínica no existe.';
  end if;

  select to_jsonb(x) into c
  from (
    select id,name,address,phone,access_enabled,subscription_status,access_changed_at,access_reason
    from public.clinics
    where id=p_clinic_id
  ) x;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.email), '[]'::jsonb)
    into members
  from (
    select cm.user_id, u.email, cm.role::text as role, coalesce(cm.active,true) as active
    from public.clinic_members cm
    left join auth.users u on u.id=cm.user_id
    where cm.clinic_id=p_clinic_id
  ) x;

  select coalesce(jsonb_agg(o.name order by o.name), '[]'::jsonb)
    into paths
  from storage.objects o
  where o.bucket_id='reports'
    and (storage.foldername(o.name))[1] = p_clinic_id::text;

  return jsonb_build_object(
    'format','EcoReport Clinic Backup',
    'version','5.8.8.11',
    'created_at',now(),
    'clinic',coalesce(c,'{}'::jsonb),
    'members',members,
    'storage_files',paths,
    'tables',jsonb_build_object(
      'patients',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select * from public.patients where clinic_id=p_clinic_id) x),
      'sonographers',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select * from public.sonographers where clinic_id=p_clinic_id) x),
      'templates',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select * from public.templates where clinic_id=p_clinic_id) x),
      'consultation_templates',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select * from public.consultation_templates where clinic_id=p_clinic_id) x),
      'specialties',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select * from public.specialties where clinic_id=p_clinic_id) x),
      'appointments',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select * from public.appointments where clinic_id=p_clinic_id) x),
      'consultations',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select * from public.consultations where clinic_id=p_clinic_id) x),
      'reports',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select * from public.reports where clinic_id=p_clinic_id) x),
      'prescriptions',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select * from public.prescriptions where clinic_id=p_clinic_id) x),
      'prescription_items',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (
          select pi.* from public.prescription_items pi
          join public.prescriptions p on p.id=pi.prescription_id
          where p.clinic_id=p_clinic_id
        ) x),
      'specialty_members',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (
          select sm.* from public.specialty_members sm
          join public.specialties s on s.id=sm.specialty_id
          where s.clinic_id=p_clinic_id
        ) x),
      'report_access_log',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (
          select ral.* from public.report_access_log ral
          join public.reports r on r.id=ral.report_id
          where r.clinic_id=p_clinic_id
        ) x),
      'consultation_access_log',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (
          select cal.* from public.consultation_access_log cal
          join public.consultations c2 on c2.id=cal.consultation_id
          where c2.clinic_id=p_clinic_id
        ) x)
    )
  );
end;
$$;

revoke all on function public.owner_backup_clinic(uuid) from public;
grant execute on function public.owner_backup_clinic(uuid) to authenticated;

-- ============================================================
-- FIN V5.8.8.11
-- ============================================================
