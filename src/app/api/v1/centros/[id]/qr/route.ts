import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import { regenerateTenantQR } from '@/services/centros.service'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const qrData = await regenerateTenantQR(params.id)
    return NextResponse.json(qrData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}