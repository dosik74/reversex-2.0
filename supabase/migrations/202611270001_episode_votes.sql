create table public.episode_votes (
  episode_id bigint not null check (episode_id > 0),
  user_id uuid not null references auth.users(id) on delete cascade,
  score smallint not null check (score between 10 and 100),
  primary key (episode_id, user_id)
);

alter table public.episode_votes enable row level security;
revoke all on public.episode_votes from public, anon, authenticated;
grant select, insert, delete, update on public.episode_votes to authenticated;
create policy own_votes on public.episode_votes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Only aggregate counts and the caller's own score leave this function.
create function public.episode_vote_summary(target_episode bigint)
returns jsonb language sql stable security definer set search_path = '' as $$
  with counts as (
    select score, count(*) as votes, max(score) filter (where user_id = auth.uid()) as mine
    from public.episode_votes where episode_id = target_episode group by score
  ), bins as (
    select round(score / 10.0)::int as bucket, sum(votes) as votes
    from counts group by 1
  )
  select jsonb_build_object(
    'count', coalesce(sum(votes), 0),
    'average', round(sum(score * votes) / nullif(sum(votes), 0) / 10, 1),
    'mine', max(mine) / 10.0,
    'bins', (select jsonb_agg(coalesce(b.votes, 0) order by n)
             from generate_series(1, 10) n left join bins b on b.bucket = n)
  ) from counts;
$$;
revoke all on function public.episode_vote_summary(bigint) from public;
grant execute on function public.episode_vote_summary(bigint) to anon, authenticated;
