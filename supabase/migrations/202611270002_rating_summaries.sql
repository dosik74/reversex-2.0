create or replace function public.title_vote_average(target_type text, target_id text)
returns numeric language sql stable security definer set search_path = '' as $$
  select round(avg(user_rating), 1) from public.content_bookmarks
  where content_type = target_type and content_id = target_id and user_rating > 0;
$$;
revoke all on function public.title_vote_average(text,text) from public;
grant execute on function public.title_vote_average(text,text) to anon, authenticated;

create or replace function public.episode_grid_scores(episode_ids bigint[])
returns table (id bigint, average numeric, mine numeric)
language sql stable security definer set search_path = '' as $$
  select episode_id, round(avg(score)/10,1),
         max(score) filter (where user_id = auth.uid()) / 10.0
  from public.episode_votes where episode_id = any(episode_ids[1:250])
  group by episode_id;
$$;
revoke all on function public.episode_grid_scores(bigint[]) from public;
grant execute on function public.episode_grid_scores(bigint[]) to anon, authenticated;
