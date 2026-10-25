-- Harden workspace creation without exposing SECURITY DEFINER execution.
-- The function runs as the caller and relies on RLS policies for authorization.

create policy madhaq_workspace_insert on public.madhaq_workspaces
for insert to authenticated
with check (created_by = auth.uid());

create policy madhaq_members_owner_insert on public.madhaq_workspace_members
for insert to authenticated
with check (
  user_id = auth.uid()
  and role = 'OWNER'
  and exists (
    select 1 from public.madhaq_workspaces w
    where w.id = workspace_id and w.created_by = auth.uid()
  )
);

create or replace function public.create_madhaq_workspace(workspace_name text)
returns uuid language plpgsql security invoker set search_path = public as $$
declare new_workspace uuid;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if workspace_name is null or length(trim(workspace_name)) < 2 or length(trim(workspace_name)) > 120 then raise exception 'INVALID_WORKSPACE_NAME'; end if;
  insert into public.madhaq_workspaces(name, created_by)
  values (trim(workspace_name), auth.uid())
  returning id into new_workspace;

  insert into public.madhaq_workspace_members(workspace_id, user_id, role)
  values (new_workspace, auth.uid(), 'OWNER');

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

revoke all on function public.create_madhaq_workspace(text) from anon;
revoke all on function public.create_madhaq_workspace(text) from public;
grant execute on function public.create_madhaq_workspace(text) to authenticated;
