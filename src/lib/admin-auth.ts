/** Default usher/admin PIN when USHER_PIN env is not set. */
export const DEFAULT_USHER_PIN = '12345'

export function getAdminPin(): string {
  return process.env.USHER_PIN ?? DEFAULT_USHER_PIN
}

export function verifyAdminPin(pin: string | null | undefined): boolean {
  if (!pin) return false
  return pin === getAdminPin()
}
