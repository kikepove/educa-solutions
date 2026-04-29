import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: {
        code: params.code,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Centro no encontrado' }, { status: 404 })
    }

    return NextResponse.json(tenant)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
