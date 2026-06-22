-- Cast / crew hold: seats physically occupied by actors during the show.
-- These must never be bookable by the public.
--
-- We introduce a distinct 'blocked' status (rendered purple in the UI) so these
-- holds are clearly separated from:
--   * 'reserved' = a customer booking
--   * 'taken'    = a booking that has been scanned in at the door
-- This keeps the hold fully reversible: to release, set the same ids back to
-- 'available'.

-- 1. Allow the new status value
ALTER TABLE public.seats DROP CONSTRAINT IF EXISTS seats_status_check;
ALTER TABLE public.seats ADD CONSTRAINT seats_status_check
  CHECK (status IN ('available','reserved','taken','blocked'));

-- 2. Block the actor-held seats — only flip seats that are still available so a
--    real (reserved/taken) booking is never overwritten.
WITH ev AS (SELECT id FROM public.events WHERE slug = 'mh-2026-09-14')
UPDATE public.seats s
SET status = 'blocked'
FROM ev
WHERE s.event_id = ev.id
  AND s.status = 'available'
  AND s.id IN (
    'A15','A16','A29','A30',
    'I15','I16','I29','I30','I31',
    'M17','N17','O17','P17',
    'N01','N02','P01','P02',
    'M29','N29','O29','P29'
  );

-- To release these holds later:
--   UPDATE public.seats SET status = 'available' WHERE status = 'blocked';
