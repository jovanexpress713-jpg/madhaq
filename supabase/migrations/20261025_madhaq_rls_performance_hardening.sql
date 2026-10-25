-- Tighten RLS policies for planner efficiency and add FK indexes.

drop policy if exists madhaq_members_manage on public.madhaq_workspace_members;
drop policy if exists madhaq_members_owner_insert on public.madhaq_workspace_members;
drop policy if exists madhaq_workspace_insert on public.madhaq_workspaces;

create or replace function public.madhaq_is_member(target_workspace uuid)
returns boolean language sql stable security invoker set search_path = public as $$
  select exists (
    select 1 from public.madhaq_workspace_members m
    where m.workspace_id = target_workspace and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.madhaq_is_manager(target_workspace uuid)
returns boolean language sql stable security invoker set search_path = public as $$
  select exists (
    select 1 from public.madhaq_workspace_members m
    where m.workspace_id = target_workspace
      and m.user_id = (select auth.uid())
      and m.role in ('OWNER','ADMIN')
  );
$$;

create or replace function public.madhaq_can_write(target_workspace uuid)
returns boolean language sql stable security invoker set search_path = public as $$
  select exists (
    select 1 from public.madhaq_workspace_members m
    where m.workspace_id = target_workspace
      and m.user_id = (select auth.uid())
      and m.role in ('OWNER','ADMIN','ACCOUNTANT','OPERATOR')
  );
$$;

create policy madhaq_workspace_insert on public.madhaq_workspaces
for insert to authenticated
with check (created_by = (select auth.uid()));

create policy madhaq_members_insert on public.madhaq_workspace_members
for insert to authenticated
with check (
  public.madhaq_is_manager(workspace_id)
  or (
    user_id = (select auth.uid())
    and role = 'OWNER'
    and exists (
      select 1 from public.madhaq_workspaces w
      where w.id = workspace_id and w.created_by = (select auth.uid())
    )
  )
);

create policy madhaq_members_update on public.madhaq_workspace_members
for update to authenticated
using (public.madhaq_is_manager(workspace_id))
with check (public.madhaq_is_manager(workspace_id));

create policy madhaq_members_delete on public.madhaq_workspace_members
for delete to authenticated
using (public.madhaq_is_manager(workspace_id));

create index if not exists madhaq_workspaces_created_by_idx on public.madhaq_workspaces(created_by);
create index if not exists madhaq_workspace_state_updated_by_idx on public.madhaq_workspace_state(updated_by);
create index if not exists madhaq_audit_actor_idx on public.madhaq_audit_log(actor_id);
