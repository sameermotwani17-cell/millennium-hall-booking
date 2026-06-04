-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── EVENTS ───────────────────────────────────────────────
create table public.events (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null,
  name        text not null,
  subtitle    text,
  date        timestamptz not null,
  doors_open  timestamptz not null,
  venue       text not null default 'Millennium Hall',
  address     text not null default 'Grand Concourse, Central District',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Seed the default event
insert into public.events (slug, name, subtitle, date, doors_open, venue)
values (
  'mh-2026-09-14',
  'An Evening at Millennium',
  'Music, culture, and elegance in a single unforgettable night',
  '2026-09-14 19:30:00+00',
  '2026-09-14 19:00:00+00',
  'Millennium Hall'
);

-- ─── SEATS ────────────────────────────────────────────────
create table public.seats (
  id          text primary key,
  event_id    uuid not null references public.events(id) on delete cascade,
  section     text not null,
  row_label   text not null,
  col_num     integer not null,
  zone        text not null check (zone in ('premium','standard','balcony','side')),
  status      text not null default 'available' check (status in ('available','reserved','taken')),
  locked_at   timestamptz,
  created_at  timestamptz not null default now()
);

create index seats_event_status on public.seats(event_id, status);
create index seats_section on public.seats(section);

-- ─── BOOKINGS ─────────────────────────────────────────────
create table public.bookings (
  id            uuid primary key default uuid_generate_v4(),
  booking_ref   text unique not null,
  event_id      uuid not null references public.events(id),
  attendee_name text not null,
  attendee_email text not null,
  seat_ids      text[] not null,
  qr_payload    text not null,
  status        text not null default 'confirmed' check (status in ('confirmed','scanned','cancelled')),
  scanned_at    timestamptz,
  scanned_by    text,
  created_at    timestamptz not null default now()
);

create index bookings_ref on public.bookings(booking_ref);
create index bookings_email on public.bookings(attendee_email);
create index bookings_status on public.bookings(status);

-- ─── SEED SEATS ───────────────────────────────────────────
create or replace function seed_seats_for_event(p_event_id uuid)
returns void language plpgsql as $$
declare
  v_section text;
  v_zone    text;
  v_rows    int;
  v_cols    int;
  r         int;
  c         int;
  row_char  text;
  seat_id   text;
  sections  text[][] := array[
    array['C',  'standard', '11', '12'],
    array['L',  'standard',  '8', '12'],
    array['R',  'standard',  '8', '12'],
    array['FL', 'premium',   '4',  '5'],
    array['FR', 'premium',   '4',  '5'],
    array['BL', 'balcony',   '7', '12'],
    array['BR', 'balcony',   '7', '12'],
    array['BC', 'balcony',  '11', '11'],
    array['RL', 'balcony',   '4',  '7'],
    array['RR', 'balcony',   '4',  '7']
  ];
  i int;
begin
  for i in 1..array_length(sections, 1) loop
    v_section := sections[i][1];
    v_zone    := sections[i][2];
    v_rows    := sections[i][3]::int;
    v_cols    := sections[i][4]::int;

    for r in 1..v_rows loop
      row_char := chr(64 + r);
      for c in 1..v_cols loop
        seat_id := v_section || row_char || lpad(c::text, 2, '0');
        if v_section = 'C' and r <= 3 then
          v_zone := 'premium';
        elsif v_section = 'C' then
          v_zone := 'standard';
        else
          v_zone := sections[i][2];
        end if;
        insert into public.seats (id, event_id, section, row_label, col_num, zone)
        values (seat_id, p_event_id, v_section, row_char, c, v_zone)
        on conflict do nothing;
      end loop;
    end loop;
  end loop;
end;
$$;

-- Seed seats for the default event
select seed_seats_for_event(
  (select id from public.events where slug = 'mh-2026-09-14')
);

-- ─── RLS POLICIES ─────────────────────────────────────────
alter table public.events   enable row level security;
alter table public.seats    enable row level security;
alter table public.bookings enable row level security;

create policy "events_public_read"   on public.events   for select using (true);
create policy "seats_public_read"    on public.seats    for select using (true);
create policy "bookings_insert"      on public.bookings for insert with check (true);
create policy "bookings_select"      on public.bookings for select using (true);
create policy "seats_update_service" on public.seats    for update using (true);
create policy "bookings_update"      on public.bookings for update using (true);

-- ─── REALTIME ─────────────────────────────────────────────
alter publication supabase_realtime add table public.seats;
