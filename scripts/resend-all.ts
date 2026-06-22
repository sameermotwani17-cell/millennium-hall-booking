/**
 * One-off: re-email the corrected ticket to every confirmed booking, sent
 * directly FROM your Gmail via Gmail SMTP (no domain needed).
 *
 * Safe by default — DRY RUN unless you pass SEND=1. Reuses the live
 * renderTicketEmail() template, so attendees get exactly the real ticket.
 *
 *   Dry run (lists who would get emailed, sends nothing):
 *     npx tsx scripts/resend-all.ts
 *   Real send:
 *     SEND=1 npx tsx scripts/resend-all.ts
 *
 * Needs in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (read bookings)
 *   GMAIL_USER            e.g. sameermotwani17@gmail.com
 *   GMAIL_APP_PASSWORD    16-char Google App Password (NOT your login password)
 * Ticket links are forced to the production URL below.
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function main() {
  // ── Load .env.local into process.env ──
  for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    const k = line.slice(0, i).trim()
    if (!process.env[k]) process.env[k] = line.slice(i + 1).trim()
  }

  const PROD_URL = 'https://millennium-hall.vercel.app'
  const APP_URL = process.env.RESEND_APP_URL_OVERRIDE || PROD_URL
  const SEND = process.env.SEND === '1'
  const DELAY_MS = 1500 // gentle pace from a personal Gmail

  const GMAIL_USER = process.env.GMAIL_USER || 'sameermotwani17@gmail.com'
  const GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '') // app passwords are shown with spaces

  const { renderTicketEmail } = await import('../src/lib/email')

  if (SEND && !GMAIL_PASS) {
    console.error('\n✋ GMAIL_APP_PASSWORD is not set in .env.local.')
    console.error('   Enable 2-Step Verification on the Google account, create an App Password')
    console.error('   (Google Account → Security → App passwords), and add it to .env.local.\n')
    process.exit(1)
  }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: bookings, error } = await sb
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .order('created_at', { ascending: true })
  if (error) { console.error('Supabase error:', error.message); process.exit(1) }

  const { data: events } = await sb.from('events').select('id,name')
  const eventName = (id: string) => events?.find(e => e.id === id)?.name ?? 'Afro Week 2026'

  console.log(`\n${SEND ? '🚀 SENDING via Gmail SMTP' : '🧪 DRY RUN'} — ${bookings!.length} confirmed bookings`)
  console.log(`   from: ${GMAIL_USER}   ticket links: ${APP_URL}\n`)

  let transporter: nodemailer.Transporter | null = null
  if (SEND) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    })
    await transporter.verify()
    console.log('   ✓ Gmail SMTP connection verified\n')
  }

  const ok: string[] = []
  const failed: { ref: string; email: string; err: string }[] = []

  for (const b of bookings!) {
    if (!SEND) { console.log(`  would email ${b.booking_ref}  ${b.attendee_email}`); continue }
    try {
      const { subject, html } = renderTicketEmail(b, eventName(b.event_id), APP_URL)
      await transporter!.sendMail({
        from: `"Afro Week 2026" <${GMAIL_USER}>`,
        to: b.attendee_email,
        subject,
        html,
      })
      ok.push(b.booking_ref)
      console.log(`  ✓ ${b.booking_ref}  ${b.attendee_email}`)
    } catch (e) {
      const msg = (e as Error)?.message ?? String(e)
      failed.push({ ref: b.booking_ref, email: b.attendee_email, err: msg })
      console.log(`  ✗ ${b.booking_ref}  ${b.attendee_email}  — ${msg}`)
    }
    await sleep(DELAY_MS)
  }

  if (SEND) {
    console.log(`\nDone. Sent: ${ok.length}  Failed: ${failed.length}`)
    if (failed.length) console.log('Failures:', JSON.stringify(failed, null, 2))
  } else {
    console.log(`\nDry run complete — nothing sent. Add GMAIL_APP_PASSWORD to .env.local, then SEND=1 to send.`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
