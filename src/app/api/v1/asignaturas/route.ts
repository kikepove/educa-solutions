import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import prisma from '@/lib/db'
import { hasPermission } from '@/utils/permissions'
import { z } from 'zod'

const createSubjectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().min(1, 'El código es requerido'),
  color: z.string().optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const subjects = await prisma.subject.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(subjects)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'horarios', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createSubjectSchema.parse(body)

    const subject = await prisma.subject.create({
      data: {
        ...data,
        tenantId: user.tenantId,
      },
    })

    return NextResponse.json(subject, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
