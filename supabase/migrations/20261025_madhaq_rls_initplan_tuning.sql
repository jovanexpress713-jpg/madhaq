-- Avoid per-row auth re-evaluation in write policies.

drop policy if exists madhaq_state_insert on public.madhaq_workspace_state;
drop policy if exists madhaq_state_update on public.madhaq_workspace_state;
drop policy if exists madhaq_audit_insert on public.madhaq_audit_log;

create policy madhaq_state_insert on public.madhaq_workspace_state
for insert to authenticated
with check ((select public.madhaq_can_write(workspace_id)) and updated_by = (select auth.uid()));

create policy madhaq_state_update on public.madhaq_workspace_state
for update to authenticated
using ((select public.madhaq_can_write(workspace_id)))
with check ((select public.madhaq_can_write(workspace_id)) and updated_by = (select auth.uid()));

create policy madhaq_audit_insert on public.madhaq_audit_log
for insert to authenticated
with check ((select public.madhaq_can_write(workspace_id)) and actor_id = (select auth.uid()));
