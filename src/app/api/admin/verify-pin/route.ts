import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPin } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  try {
    const { pin } = (await req.json()) as { pin?: string }
    if (!verifyAdminPin(pin)) {
      return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
    }
    return NextResponse.json({ valid: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
