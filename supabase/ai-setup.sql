-- AI 助教：個別設定與用量紀錄（在 Supabase → SQL Editor 執行一次；重複執行也沒關係）
-- 說明：docs/AI助教設定.md
--
-- 預設：登入的人都能用，不限次數。
-- ai_limits：只有需要「限制某人」時才加一列（平常是空的）：
--   daily_limit 填數字＝每天最多幾次；留空＝不限
--   blocked = true＝停用這個人的 AI 助教
-- ai_usage：每人每天用了幾次（台灣時間換日），只是紀錄，方便查看。
-- 兩張表都開啟 RLS 而且不建立任何 policy：一般使用者無法直接讀寫，只能透過下面兩個函式。

create table if not exists public.ai_limits (
  email       text primary key,
  daily_limit int,
  blocked     boolean not null default false,
  note        text,
  created_at  timestamptz not null default now()
);

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  n       int  not null default 0,
  primary key (user_id, day)
);

alter table public.ai_limits enable row level security;
alter table public.ai_usage  enable row level security;

-- 目前登入者的狀態（網頁與轉送程式都會呼叫）。limit / remaining 為 null 代表不限次數
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
  r    public.ai_limits%rowtype;
  used int;
  d    date := (now() at time zone 'Asia/Taipei')::date;
begin
  if uid is null then
    return json_build_object('allowed', false, 'reason', 'login');
  end if;
  select * into r from public.ai_limits l where lower(l.email) = em;
  if found and r.blocked then
    return json_build_object('allowed', false, 'reason', 'blocked', 'email', em);
  end if;
  select u.n into used from public.ai_usage u where u.user_id = uid and u.day = d;
  used := coalesce(used, 0);
  return json_build_object('allowed', true, 'email', em, 'used', used, 'limit', r.daily_limit,
                           'remaining', case when r.daily_limit is null then null else greatest(r.daily_limit - used, 0) end);
end;
$$;

-- 成功回答後記一次（由轉送程式呼叫；自己呼叫只會增加自己的紀錄）
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
  select l.daily_limit into lim from public.ai_limits l where lower(l.email) = em;
  insert into public.ai_usage as u (user_id, day, n) values (uid, d, 1)
    on conflict (user_id, day) do update set n = u.n + 1
    returning u.n into used;
  return json_build_object('allowed', true, 'used', used, 'limit', lim,
                           'remaining', case when lim is null then null else greatest(lim - used, 0) end);
end;
$$;

revoke all on function public.ai_status() from public, anon;
revoke all on function public.ai_take()   from public, anon;
grant execute on function public.ai_status() to authenticated;
grant execute on function public.ai_take()   to authenticated;

-- ▼ 需要時才用：限制或停用某個人（改成實際信箱後執行；也可以在 Table Editor → ai_limits 直接新增一列）
-- insert into public.ai_limits (email, daily_limit, note) values ('someone@gmail.com', 20, '限制每天 20 次')
--   on conflict (email) do update set daily_limit = excluded.daily_limit, note = excluded.note;
-- insert into public.ai_limits (email, blocked, note) values ('stranger@gmail.com', true, '停用')
--   on conflict (email) do update set blocked = true, note = excluded.note;
