-- Generate fixed mock test sets inside Postgres.
-- This avoids runtime RLS/table-grant issues while still requiring the caller
-- to be an authenticated admin via public.is_admin().

begin;

create or replace function public.admin_generate_test_sets_for_batch(p_batch_id integer)
returns table(test_sets_created integer, questions_assigned integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_questions_per_test integer;
  v_total_questions integer;
  v_sets_to_create integer;
  v_set_index integer;
  v_test_set_id integer;
  v_set_number integer;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select setting_value::integer
  into v_questions_per_test
  from public.app_settings
  where setting_key = 'total_questions'
  limit 1;

  if v_questions_per_test is null or v_questions_per_test <= 0 then
    raise exception 'Invalid total_questions setting';
  end if;

  select count(*)
  into v_total_questions
  from public.questions
  where batch_id = p_batch_id
    and is_active = true;

  v_sets_to_create := floor(v_total_questions::numeric / v_questions_per_test)::integer;

  delete from public.test_set_questions tsq
  using public.test_sets ts
  where tsq.test_set_id = ts.id
    and ts.batch_id = p_batch_id;

  delete from public.test_sets
  where batch_id = p_batch_id;

  if v_sets_to_create <= 0 then
    test_sets_created := 0;
    questions_assigned := 0;
    return next;
    return;
  end if;

  drop table if exists pg_temp.generated_test_questions;
  create temporary table generated_test_questions on commit drop as
  select
    q.id as question_id,
    row_number() over (order by random()) as row_num
  from public.questions q
  where q.batch_id = p_batch_id
    and q.is_active = true;

  for v_set_index in 0..(v_sets_to_create - 1) loop
    v_set_number := v_set_index + 1;

    insert into public.test_sets (
      batch_id,
      set_number,
      name,
      total_questions,
      is_active
    )
    values (
      p_batch_id,
      v_set_number,
      'Test ' || v_set_number,
      v_questions_per_test,
      true
    )
    returning id into v_test_set_id;

    insert into public.test_set_questions (
      test_set_id,
      question_id,
      question_order
    )
    select
      v_test_set_id,
      question_id,
      row_num - (v_set_index * v_questions_per_test)
    from pg_temp.generated_test_questions
    where row_num > (v_set_index * v_questions_per_test)
      and row_num <= ((v_set_index + 1) * v_questions_per_test)
    order by row_num;
  end loop;

  test_sets_created := v_sets_to_create;
  questions_assigned := v_sets_to_create * v_questions_per_test;
  return next;
end;
$$;

grant execute on function public.admin_generate_test_sets_for_batch(integer) to authenticated;

commit;
