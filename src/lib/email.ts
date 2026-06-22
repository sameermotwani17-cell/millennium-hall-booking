import { Resend } from 'resend'
import type { Booking } from '@/types'

export async function sendTicketEmail(booking: Booking, eventName: string): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'YOUR_RESEND_API_KEY') {
    console.log(`[demo] Skipping email to ${booking.attendee_email} — RESEND_API_KEY not set. Ticket ref: ${booking.booking_ref}`)
    return
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const ticketUrl = `${appUrl}/ticket?ref=${booking.booking_ref}`
  const seatList = booking.seat_ids.join(' · ')

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'tickets@millenniumhall.com',
    to: booking.attendee_email,
    subject: `🎟 Your AFRO WEEK 2026 Ticket — ${booking.booking_ref}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AFRO WEEK 2026 — Your Ticket</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Inter',system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

  <!-- Pan-African bar -->
  <tr>
    <td style="padding:0;line-height:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="33%" style="background:#C8102E;height:4px;line-height:4px;">&nbsp;</td>
          <td width="34%" style="background:#FCD116;height:4px;line-height:4px;">&nbsp;</td>
          <td width="33%" style="background:#006B3F;height:4px;line-height:4px;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Header -->
  <tr>
    <td style="background:#111111;padding:36px 40px 28px;border-left:1px solid rgba(252,209,22,0.12);border-right:1px solid rgba(252,209,22,0.12);">
      <div style="font-family:'Bebas Neue','Arial Black',sans-serif;font-size:52px;letter-spacing:4px;color:#FFFFFF;line-height:1;margin-bottom:2px;">AFRO WEEK</div>
      <div style="font-family:'Bebas Neue','Arial Black',sans-serif;font-size:28px;letter-spacing:3px;color:#FCD116;line-height:1;margin-bottom:16px;">2026</div>
      <div style="display:inline-block;background:#FCD116;color:#000000;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:600;padding:4px 12px;border-radius:2px;">
        ✓ &nbsp; TICKET CONFIRMED
      </div>
    </td>
  </tr>

  <!-- Event details -->
  <tr>
    <td style="background:#0D0D0D;padding:28px 40px 0;border-left:1px solid rgba(252,209,22,0.12);border-right:1px solid rgba(252,209,22,0.12);">
      <div style="font-size:22px;color:#FFFFFF;font-weight:300;margin-bottom:4px;">${eventName}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.4);letter-spacing:1px;margin-bottom:28px;">
        Friday, 26 June 2026 &nbsp;·&nbsp; 7:30 PM &nbsp;·&nbsp; Millennium Hall · APU
      </div>

      <!-- Info grid -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="padding:16px 0;border-top:1px solid rgba(252,209,22,0.12);vertical-align:top;">
            <div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#FCD116;margin-bottom:6px;font-weight:600;">Attendee</div>
            <div style="font-size:18px;color:#FFFFFF;font-weight:400;">${booking.attendee_name}</div>
          </td>
          <td width="50%" style="padding:16px 0;border-top:1px solid rgba(252,209,22,0.12);vertical-align:top;">
            <div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#FCD116;margin-bottom:6px;font-weight:600;">Booking Ref</div>
            <div style="font-family:'Bebas Neue','Arial Black',sans-serif;font-size:22px;color:#FCD116;letter-spacing:3px;">${booking.booking_ref}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:16px 0;border-top:1px solid rgba(252,209,22,0.12);">
            <div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#FCD116;margin-bottom:6px;font-weight:600;">Seats</div>
            <div style="font-family:'Bebas Neue','Arial Black',sans-serif;font-size:20px;color:#FFFFFF;letter-spacing:2px;">${seatList}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:16px 0;border-top:1px solid rgba(252,209,22,0.12);">
            <div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#FCD116;margin-bottom:6px;font-weight:600;">Venue</div>
            <div style="font-size:15px;color:rgba(255,255,255,0.7);">Millennium Hall &nbsp;·&nbsp; APU</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="background:#0D0D0D;padding:28px 40px;border-left:1px solid rgba(252,209,22,0.12);border-right:1px solid rgba(252,209,22,0.12);text-align:center;">
      <a href="${ticketUrl}"
        style="display:inline-block;background:#FCD116;color:#000000;text-decoration:none;padding:16px 44px;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:700;border-radius:2px;">
        VIEW YOUR e-TICKET & QR CODE
      </a>
    </td>
  </tr>

  <!-- At-the-door info -->
  <tr>
    <td style="background:#111111;padding:24px 40px;border:1px solid rgba(252,209,22,0.12);border-top:none;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="33%" style="padding:0 8px 0 0;text-align:center;vertical-align:top;">
            <div style="font-size:20px;margin-bottom:6px;">🎟</div>
            <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#FCD116;margin-bottom:3px;">Entry</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.45);line-height:1.5;">Show your QR code — screen or printed</div>
          </td>
          <td width="33%" style="padding:0 8px;text-align:center;vertical-align:top;">
            <div style="font-size:20px;margin-bottom:6px;">🚪</div>
            <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#FCD116;margin-bottom:3px;">Doors Open</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.45);line-height:1.5;">7:00 PM — arrive early</div>
          </td>
          <td width="33%" style="padding:0 0 0 8px;text-align:center;vertical-align:top;">
            <div style="font-size:20px;margin-bottom:6px;">⏰</div>
            <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#FCD116;margin-bottom:3px;">No Late Entry</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.45);line-height:1.5;">Doors close at 7:30 PM sharp</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Flag row -->
  <tr>
    <td style="background:#0D0D0D;padding:16px 40px;border-left:1px solid rgba(252,209,22,0.12);border-right:1px solid rgba(252,209,22,0.12);border-bottom:none;text-align:center;">
      <div style="font-size:22px;letter-spacing:6px;">🇳🇬 🇬🇭 🇰🇪 🇿🇦 🇸🇳 🇨🇲 🇪🇹 🇷🇼</div>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:0;line-height:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="33%" style="background:#C8102E;height:3px;line-height:3px;">&nbsp;</td>
          <td width="34%" style="background:#FCD116;height:3px;line-height:3px;">&nbsp;</td>
          <td width="33%" style="background:#006B3F;height:3px;line-height:3px;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#080808;padding:16px 40px;text-align:center;">
      <div style="font-size:10px;color:rgba(255,255,255,0.2);letter-spacing:1px;">AFRO WEEK 2026 &nbsp;·&nbsp; Millennium Hall &nbsp;·&nbsp; Ref: ${booking.booking_ref}</div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`.trim(),
  })
}
