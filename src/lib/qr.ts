import QRCode from 'qrcode'

export async function generateQRDataURL(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'M',
    margin: 1,
    color: { dark: '#2E1A08', light: '#FFFEF8' },
    width: 200,
  })
}
