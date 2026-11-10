create extension if not exists vector with schema extensions;

create type public.document_status as enum ('uploaded','parsing','chunking','embedding','ready','failed');
create type public.workspace_role as enum ('owner','admin','member','viewer');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.workspaces to authenticated;
grant all on public.workspaces to service_role;
alter table public.workspaces enable row level security;

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index on public.workspace_members(user_id);
grant select on public.workspace_members to authenticated;
grant all on public.workspace_members to service_role;
alter table public.workspace_members enable row level security;

create or replace function public.is_workspace_member(_ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.workspace_members where workspace_id = _ws and user_id = auth.uid())
$$;
create or replace function public.can_write_workspace(_ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.workspace_members where workspace_id = _ws and user_id = auth.uid() and role <> 'viewer')
$$;

create policy "members read workspace" on public.workspaces for select to authenticated using (public.is_workspace_member(id));
create policy "owner updates workspace" on public.workspaces for update to authenticated using (owner_id = auth.uid());
create policy "members read memberships" on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id));

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  file_name text not null,
  file_type text not null,
  size_bytes integer not null,
  sha256 text not null,
  storage_path text not null,
  status public.document_status not null default 'uploaded',
  status_detail text,
  version integer not null default 1,
  page_count integer,
  chunk_count integer not null default 0,
  is_demo boolean not null default false,
  uploaded_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, sha256)
);
create index on public.documents(workspace_id, created_at desc);
grant select, insert, update, delete on public.documents to authenticated;
grant all on public.documents to service_role;
alter table public.documents enable row level security;
create policy "members read docs" on public.documents for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "writers insert docs" on public.documents for insert to authenticated with check (public.can_write_workspace(workspace_id) and uploaded_by = auth.uid());
create policy "writers update docs" on public.documents for update to authenticated using (public.can_write_workspace(workspace_id));
create policy "writers delete docs" on public.documents for delete to authenticated using (public.can_write_workspace(workspace_id));

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  document_version integer not null,
  chunk_index integer not null,
  page_number integer,
  section text,
  content text not null,
  token_estimate integer not null,
  embedding extensions.vector(3072) not null,
  embedding_model text not null,
  fts tsvector generated always as (to_tsvector('english', coalesce(section,'') || ' ' || content)) stored,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);
create index on public.document_chunks(workspace_id);
create index on public.document_chunks using gin(fts);
create index document_chunks_embedding_idx on public.document_chunks
  using hnsw ((embedding::extensions.halfvec(3072)) extensions.halfvec_cosine_ops);
grant select, insert, update, delete on public.document_chunks to authenticated;
grant all on public.document_chunks to service_role;
alter table public.document_chunks enable row level security;
create policy "members read chunks" on public.document_chunks for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "writers insert chunks" on public.document_chunks for insert to authenticated with check (public.can_write_workspace(workspace_id));
create policy "writers delete chunks" on public.document_chunks for delete to authenticated using (public.can_write_workspace(workspace_id));

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  question text not null,
  status text not null default 'running',
  answer jsonb,
  model text not null,
  embedding_model text not null,
  prompt_version text not null,
  latency_ms integer,
  input_tokens integer,
  output_tokens integer,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index on public.agent_runs(workspace_id, created_at desc);
grant select, insert, update on public.agent_runs to authenticated;
grant all on public.agent_runs to service_role;
alter table public.agent_runs enable row level security;
create policy "members read runs" on public.agent_runs for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members create runs" on public.agent_runs for insert to authenticated with check (public.is_workspace_member(workspace_id) and user_id = auth.uid());
create policy "owner updates runs" on public.agent_runs for update to authenticated using (user_id = auth.uid());

create table public.run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  step_index integer not null,
  kind text not null,
  name text not null,
  status text not null,
  input jsonb,
  output jsonb,
  duration_ms integer,
  created_at timestamptz not null default now()
);
create index on public.run_steps(run_id, step_index);
grant select, insert on public.run_steps to authenticated;
grant all on public.run_steps to service_role;
alter table public.run_steps enable row level security;
create policy "members read steps" on public.run_steps for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members insert steps" on public.run_steps for insert to authenticated with check (exists (select 1 from public.agent_runs r where r.id = run_id and r.user_id = auth.uid() and r.workspace_id = run_steps.workspace_id));

create table public.run_citations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  marker integer not null,
  chunk_id uuid references public.document_chunks(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  document_title text not null,
  document_version integer not null,
  page_number integer,
  section text,
  passage text not null,
  created_at timestamptz not null default now()
);
create index on public.run_citations(run_id);
grant select, insert on public.run_citations to authenticated;
grant all on public.run_citations to service_role;
alter table public.run_citations enable row level security;
create policy "members read citations" on public.run_citations for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members insert citations" on public.run_citations for insert to authenticated with check (exists (select 1 from public.agent_runs r where r.id = run_id and r.user_id = auth.uid() and r.workspace_id = run_citations.workspace_id));

-- Hybrid retrieval (semantic + keyword, reciprocal rank fusion). SECURITY INVOKER: RLS scopes to caller's workspaces.
create or replace function public.hybrid_search(
  _workspace_id uuid, _query_embedding extensions.vector(3072), _query_text text, _match_count int default 8
) returns table (
  chunk_id uuid, document_id uuid, document_title text, document_version int, page_number int,
  section text, content text, semantic_rank int, keyword_rank int, similarity float, score float
) language sql stable security invoker set search_path = public, extensions as $$
  with sem as (
    select c.id, row_number() over (order by c.embedding::halfvec(3072) <=> _query_embedding::halfvec(3072))::int as rnk,
           1 - (c.embedding::halfvec(3072) <=> _query_embedding::halfvec(3072)) as sim
    from public.document_chunks c
    join public.documents d on d.id = c.document_id and d.status = 'ready'
    where c.workspace_id = _workspace_id
    order by c.embedding::halfvec(3072) <=> _query_embedding::halfvec(3072)
    limit 30
  ), kw as (
    select c.id, row_number() over (order by ts_rank_cd(c.fts, q) desc)::int as rnk
    from public.document_chunks c
    join public.documents d on d.id = c.document_id and d.status = 'ready',
         websearch_to_tsquery('english', _query_text) q
    where c.workspace_id = _workspace_id and c.fts @@ q
    order by ts_rank_cd(c.fts, q) desc
    limit 30
  ), fused as (
    select coalesce(sem.id, kw.id) as id, sem.rnk as srank, kw.rnk as krank, sem.sim,
      coalesce(1.0/(60+sem.rnk),0) + coalesce(1.0/(60+kw.rnk),0) as score
    from sem full outer join kw on sem.id = kw.id
  )
  select c.id, c.document_id, d.title, c.document_version, c.page_number, c.section, c.content,
         f.srank, f.krank, f.sim, f.score
  from fused f join public.document_chunks c on c.id = f.id join public.documents d on d.id = c.document_id
  order by f.score desc
  limit greatest(1, least(_match_count, 20));
$$;
grant execute on function public.hybrid_search(uuid, extensions.vector, text, int) to authenticated;

-- Provision a private workspace for each new user
create or replace function public.handle_new_user_workspace()
returns trigger language plpgsql security definer set search_path = public as $$
declare ws uuid;
begin
  insert into public.workspaces(name, owner_id)
  values (coalesce(split_part(new.email,'@',1),'My') || '''s workspace', new.id) returning id into ws;
  insert into public.workspace_members(workspace_id, user_id, role) values (ws, new.id, 'owner');
  return new;
end $$;
create trigger on_auth_user_created_workspace after insert on auth.users
for each row execute function public.handle_new_user_workspace();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger documents_touch before update on public.documents for each row execute function public.touch_updated_at();

-- Storage policies: object path = <workspace_id>/<document_id>/<file>
create policy "members read ws files" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.is_workspace_member(((storage.foldername(name))[1])::uuid));
create policy "writers upload ws files" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.can_write_workspace(((storage.foldername(name))[1])::uuid));
create policy "writers delete ws files" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and public.can_write_workspace(((storage.foldername(name))[1])::uuid));