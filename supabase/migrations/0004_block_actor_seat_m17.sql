-- M17 was held back from migration 0003 because it was not 'available'.
-- Investigation showed M17 was a PHANTOM reservation: status='reserved' with
-- zero booking rows referencing it (no attendee, no email). It is therefore
-- safe to reclaim for the cast hold — no real customer is displaced.
--
-- NOTE: M17 is one of ~75 orphaned 'reserved' seats (reserved with no real
-- booking) that should be audited separately — they block public bookings
-- without representing a sale.

WITH ev AS (SELECT id FROM public.events WHERE slug='mh-2026-09-14')
UPDATE public.seats s
SET status = 'blocked'
FROM ev
WHERE s.event_id = ev.id
  AND s.id = 'M17'
  AND s.status = 'reserved'
  AND NOT EXISTS (SELECT 1 FROM public.bookings b WHERE 'M17' = ANY(b.seat_ids));
