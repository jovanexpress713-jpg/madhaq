-- MADHAQ cloud foundation
-- Apply this migration to the connected Supabase project before enabling cloud mode.
-- Client code uses only the publishable key; RLS is the authorization boundary.

create extension if not exists pgcrypto;

create table if not exists public.madhaq_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict
);

create table if not exists public.madhaq_workspace_members (
  workspace_id uuid not null references public.madhaq_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('OWNER','ADMIN','ACCOUNTANT','OPERATOR','VIEWER')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.madhaq_workspace_state (
  workspace_id uuid primary key references public.madhaq_workspaces(id) on delete cascade,
  version bigint not null default 1 check (version > 0),
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.madhaq_audit_log (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.madhaq_workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists madhaq_workspace_members_user_idx on public.madhaq_workspace_members(user_id);
create index if not exists madhaq_audit_workspace_created_idx on public.madhaq_audit_log(workspace_id, created_at desc);

alter table public.madhaq_workspaces enable row level security;
alter table public.madhaq_workspace_members enable row level security;
alter table public.madhaq_workspace_state enable row level security;
alter table public.madhaq_audit_log enable row level security;

create or replace function public.madhaq_is_member(target_workspace uuid)
returns boolean language sql stable security invoker set search_path = public as $$
  select exists (select 1 from public.madhaq_workspace_members m where m.workspace_id = target_workspace and m.user_id = auth.uid());
$$;

create or replace function public.madhaq_is_manager(target_workspace uuid)
returns boolean language sql stable security invoker set search_path = public as $$
  select exists (select 1 from public.madhaq_workspace_members m where m.workspace_id = target_workspace and m.user_id = auth.uid() and m.role in ('OWNER','ADMIN'));
$$;

create or replace function public.madhaq_can_write(target_workspace uuid)
returns boolean language sql stable security invoker set search_path = public as $$
  select exists (select 1 from public.madhaq_workspace_members m where m.workspace_id = target_workspace and m.user_id = auth.uid() and m.role in ('OWNER','ADMIN','ACCOUNTANT','OPERATOR'));
$$;

create policy madhaq_workspace_select on public.madhaq_workspaces for select to authenticated using (public.madhaq_is_member(id));
create policy madhaq_members_select on public.madhaq_workspace_members for select to authenticated using (public.madhaq_is_member(workspace_id));
create policy madhaq_members_manage on public.madhaq_workspace_members for all to authenticated using (public.madhaq_is_manager(workspace_id)) with check (public.madhaq_is_manager(workspace_id));
create policy madhaq_state_select on public.madhaq_workspace_state for select to authenticated using (public.madhaq_is_member(workspace_id));
create policy madhaq_state_insert on public.madhaq_workspace_state for insert to authenticated with check (public.madhaq_can_write(workspace_id) and updated_by = auth.uid());
create policy madhaq_state_update on public.madhaq_workspace_state for update to authenticated using (public.madhaq_can_write(workspace_id)) with check (public.madhaq_can_write(workspace_id) and updated_by = auth.uid());
create policy madhaq_audit_select on public.madhaq_audit_log for select to authenticated using (public.madhaq_is_member(workspace_id));
create policy madhaq_audit_insert on public.madhaq_audit_log for insert to authenticated with check (public.madhaq_can_write(workspace_id) and actor_id = auth.uid());

create or replace function public.create_madhaq_workspace(workspace_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_workspace uuid;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.madhaq_workspaces(name, created_by) values (trim(workspace_name), auth.uid()) returning id into new_workspace;
  insert into public.madhaq_workspace_members(workspace_id, user_id, role) values (new_workspace, auth.uid(), 'OWNER');
  insert into public.madhaq_workspace_state(workspace_id, version, payload, updated_by)
  values (new_workspace, 1, jsonb_build_object(
    'version', 3, 'distributors', jsonb_build_array(), 'products', jsonb_build_array(),
    'distributions', jsonb_build_array(), 'collections', jsonb_build_array(), 'returns', jsonb_build_array(),
    'suppliers', jsonb_build_array(), 'rawMaterials', jsonb_build_array(), 'purchases', jsonb_build_array(),
    'supplierPayments', jsonb_build_array(), 'recipes', jsonb_build_array(), 'productionBatches', jsonb_build_array(),
    'expenses', jsonb_build_array(), 'areas', jsonb_build_array(), 'customers', jsonb_build_array(),
    'customerSales', jsonb_build_array(), 'customerPayments', jsonb_build_array(), 'supplyRequests', jsonb_build_array(),
    'customerReturns', jsonb_build_array(), 'customerWeeklyCloses', jsonb_build_array()
  ), auth.uid());
  return new_workspace;
end;
$$;

revoke all on function public.create_madhaq_workspace(text) from public;
grant execute on function public.create_madhaq_workspace(text) to authenticated;

-- Never expose a Supabase secret/service-role key to the browser or APK.
