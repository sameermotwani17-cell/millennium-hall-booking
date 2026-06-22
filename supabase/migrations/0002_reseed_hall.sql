-- Clear all existing bookings and seats, then re-seed with
-- the actual Millennium Hall seating layout (rows A-R, seats 1-44).
-- Seat ID format: {ROW_LETTER}{SEAT_NUMBER_PADDED}  e.g. 'A05', 'R17'

-- 1. Clear bookings first (FK constraint)
DELETE FROM public.bookings;

-- 2. Clear seats
DELETE FROM public.seats;

-- 3. New seeding function
CREATE OR REPLACE FUNCTION reseed_millennium_hall_v2()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_event_id uuid;
  row_letter  text;
  seat_num    int;
  seat_id     text;
  seat_zone   text;
  seat_section text;

  -- Each entry: [row, leftStart, leftEnd, rightStart, rightEnd, isBalcony]
  -- Center block is always seats 17-28
  -- leftStart=0 means no left block (wheelchair-only row R)
  rows text[][] := ARRAY[
    -- Main Floor (A-J)
    ARRAY['A','5', '16','29','40','false'],
    ARRAY['B','5', '16','29','41','false'],
    ARRAY['C','4', '16','29','42','false'],
    ARRAY['D','2', '16','29','43','false'],
    ARRAY['E','1', '16','29','44','false'],
    ARRAY['F','1', '16','29','44','false'],
    ARRAY['G','1', '16','29','44','false'],
    ARRAY['H','1', '16','29','44','false'],
    ARRAY['I','5', '16','29','40','false'],
    ARRAY['J','5', '16','29','40','false'],
    -- Balcony (K-R)
    ARRAY['K','5', '16','29','40','true'],
    ARRAY['L','1', '16','29','44','true'],
    ARRAY['M','1', '16','29','44','true'],
    ARRAY['N','1', '16','29','44','true'],
    ARRAY['O','1', '16','29','44','true'],
    ARRAY['P','1', '16','29','44','true'],
    ARRAY['Q','1', '16','29','44','true'],
    ARRAY['R','0', '0', '0', '0', 'true']   -- wheelchair: center only
  ];
  i          int;
  left_start int;
  left_end   int;
  right_start int;
  right_end  int;
  is_balcony boolean;
BEGIN
  SELECT id INTO v_event_id FROM public.events WHERE slug = 'mh-2026-09-14';
  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'Event mh-2026-09-14 not found';
  END IF;

  FOR i IN 1..array_length(rows, 1) LOOP
    row_letter  := rows[i][1];
    left_start  := rows[i][2]::int;
    left_end    := rows[i][3]::int;
    right_start := rows[i][4]::int;
    right_end   := rows[i][5]::int;
    is_balcony  := rows[i][6]::boolean;

    -- Left block (seats 1-16)
    IF left_start > 0 THEN
      FOR seat_num IN left_start..left_end LOOP
        seat_id      := row_letter || lpad(seat_num::text, 2, '0');
        seat_section := 'L';
        seat_zone    := CASE WHEN is_balcony THEN 'balcony' ELSE 'standard' END;
        INSERT INTO public.seats (id, event_id, section, row_label, col_num, zone)
        VALUES (seat_id, v_event_id, seat_section, row_letter, seat_num, seat_zone)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;

    -- Center block (seats 17-28)
    FOR seat_num IN 17..28 LOOP
      seat_id      := row_letter || lpad(seat_num::text, 2, '0');
      seat_section := 'C';
      seat_zone    := CASE
        WHEN is_balcony         THEN 'balcony'
        WHEN row_letter IN ('A','B','C') THEN 'premium'
        ELSE 'standard'
      END;
      INSERT INTO public.seats (id, event_id, section, row_label, col_num, zone)
      VALUES (seat_id, v_event_id, seat_section, row_letter, seat_num, seat_zone)
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- Right block (seats 29-44)
    IF right_start > 0 THEN
      FOR seat_num IN right_start..right_end LOOP
        seat_id      := row_letter || lpad(seat_num::text, 2, '0');
        seat_section := 'R';
        seat_zone    := CASE WHEN is_balcony THEN 'balcony' ELSE 'standard' END;
        INSERT INTO public.seats (id, event_id, section, row_label, col_num, zone)
        VALUES (seat_id, v_event_id, seat_section, row_letter, seat_num, seat_zone)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;

  RAISE NOTICE 'Reseeded Millennium Hall: % seats', (SELECT COUNT(*) FROM public.seats WHERE event_id = v_event_id);
END;
$$;

SELECT reseed_millennium_hall_v2();
