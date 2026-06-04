import { Resend } from 'resend'
import type { Booking } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendTicketEmail(booking: Booking, eventName: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const ticketUrl = `${appUrl}/ticket?ref=${booking.booking_ref}`
  const seatList = booking.seat_ids.join(', ')

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'tickets@millenniumhall.com',
    to: booking.attendee_email,
    subject: `Your ticket for ${eventName} — ${booking.booking_ref}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Your e-Ticket</title>
</head>
<body style="margin:0;padding:0;background:#F0E8D5;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0E8D5;padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#1A0F04;border-radius:12px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#2E1A08,#1A0F04);padding:32px 36px;">
          <div style="font-size:22px;font-weight:bold;color:#F0DFC0;letter-spacing:2px;">MILLENNIUM HALL</div>
          <div style="font-size:13px;color:#C8A97A;margin-top:6px;letter-spacing:1px;">e-TICKET · CONFIRMED</div>
        </td></tr>
        <tr><td style="background:#F8F3E8;padding:32px 36px;">
          <div style="font-size:24px;color:#2E1A08;font-family:'Georgia',serif;margin-bottom:4px;">${eventName}</div>
          <div style="font-size:13px;color:#8A7055;margin-bottom:28px;">Saturday, 14 September 2026 · 7:30 PM · Millennium Hall</div>
          <table width="100%" style="border-collapse:collapse;margin-bottom:24px;">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(139,96,60,0.15);">
                <span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8A7055;display:block;margin-bottom:3px;">Attendee</span>
                <span style="font-size:16px;color:#2E1A08;font-style:italic;">${booking.attendee_name}</span>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid rgba(139,96,60,0.15);">
                <span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8A7055;display:block;margin-bottom:3px;">Booking Ref</span>
                <span style="font-size:16px;color:#C9930A;font-weight:bold;">${booking.booking_ref}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;" colspan="2">
                <span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8A7055;display:block;margin-bottom:3px;">Seats</span>
                <span style="font-size:16px;color:#2E1A08;font-weight:bold;">${seatList}</span>
              </td>
            </tr>
          </table>
          <div style="text-align:center;margin:28px 0;">
            <a href="${ticketUrl}" style="display:inline-block;background:#2E4A2E;color:#F0DFC0;text-decoration:none;padding:14px 36px;border-radius:3px;font-size:13px;letter-spacing:2px;text-transform:uppercase;">View Your e-Ticket</a>
          </div>
          <div style="background:#F0E8D5;border-radius:6px;padding:16px;font-size:12px;color:#8A7055;line-height:1.7;">
            <strong style="color:#5C3D1E;">At the door:</strong> Show your QR code (on screen or printed) to our usher team.<br>
            <strong style="color:#5C3D1E;">Doors open:</strong> 7:00 PM · No late admission after 7:30 PM
          </div>
        </td></tr>
        <tr><td style="padding:20px 36px;background:#0E0904;">
          <div style="font-size:11px;color:#5C3D1E;">Millennium Hall · Grand Concourse, Central District · ${booking.booking_ref}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  })
}
