-- AI 助教：白名單與每日用量（在 Supabase → SQL Editor 執行一次；重複執行也沒關係）
-- 說明：docs/AI助教設定.md
--
-- ai_allow：可以使用 AI 助教的信箱與每人每日上限。只能在後台（Table Editor）新增／修改，網頁讀不到。
-- ai_usage：每人每天用了幾次（台灣時間換日）。
-- 兩張表都開啟 RLS 而且不建立任何 policy：一般使用者無法直接讀寫，只能透過下面三個函式。

create table if not exists public.ai_allow (
  email       text primary key,
  daily_limit int  not null default 30,
  note        text,
  created_at  timestamptz not null default now()
);

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  n       int  not null default 0,
  primary key (user_id, day)
);

alter table public.ai_allow enable row level security;
alter table public.ai_usage enable row level security;

-- 目前登入者的狀態：是否在白名單、今天的上限與剩餘次數（網頁與轉送程式都會呼叫）
create or replace function public.ai_status()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid  uuid := auth.uid();
  em   text := lower(coalesce(auth.jwt() ->> 'email', ''));
  lim  int;
  used int;
  d    date := (now() at time zone 'Asia/Taipei')::date;
begin
  if uid is null then
    return json_build_object('allowed', false, 'reason', 'login');
  end if;
  select a.daily_limit into lim from public.ai_allow a where lower(a.email) = em;
  if lim is null then
    return json_build_object('allowed', false, 'reason', 'not_allowed', 'email', em);
  end if;
  select u.n into used from public.ai_usage u where u.user_id = uid and u.day = d;
  used := coalesce(used, 0);
  return json_build_object('allowed', true, 'email', em, 'limit', lim, 'used', used,
                           'remaining', greatest(lim - used, 0));
end;
$$;

-- 成功回答後扣一次（由轉送程式呼叫；自己呼叫只會扣自己的次數）
create or replace function public.ai_take()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid  uuid := auth.uid();
  em   text := lower(coalesce(auth.jwt() ->> 'email', ''));
  lim  int;
  used int;
  d    date := (now() at time zone 'Asia/Taipei')::date;
begin
  if uid is null then
    return json_build_object('allowed', false, 'reason', 'login');
  end if;
  select a.daily_limit into lim from public.ai_allow a where lower(a.email) = em;
  if lim is null then
    return json_build_object('allowed', false, 'reason', 'not_allowed', 'email', em);
  end if;
  insert into public.ai_usage as u (user_id, day, n) values (uid, d, 1)
    on conflict (user_id, day) do update set n = u.n + 1
    returning u.n into used;
  return json_build_object('allowed', true, 'limit', lim, 'used', used,
                           'remaining', greatest(lim - used, 0));
end;
$$;

revoke all on function public.ai_status() from public, anon;
revoke all on function public.ai_take()   from public, anon;
grant execute on function public.ai_status() to authenticated;
grant execute on function public.ai_take()   to authenticated;

-- ▼ 把可以使用的人加進白名單（改成實際信箱後執行；之後也可以在 Table Editor → ai_allow 直接新增一列）
-- insert into public.ai_allow (email, daily_limit, note) values
--   ('你的信箱@gmail.com', 50, '我'),
--   ('朋友的信箱@gmail.com', 30, '朋友')
-- on conflict (email) do update set daily_limit = excluded.daily_limit, note = excluded.note;
