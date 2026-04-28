import QRCode from 'qrcode'

export async function generateQRCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })
}

export async function generateQRCodeSVG(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    width: 300,
    margin: 2,
  })
}

export function getPublicIncidentUrl(tenantCode: string): string {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
  return `${baseUrl}/v1/public/incidencias/${tenantCode}`
}

export async function generateTenantQR(tenantCode: string) {
  const url = getPublicIncidentUrl(tenantCode)
  const qrDataUrl = await generateQRCode(url)
  return {
    url,
    qrDataUrl,
  }
}
