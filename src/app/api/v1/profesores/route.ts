import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import prisma from '@/lib/db'
import { createTeacherSchema } from '@/utils/validation'
import { createTeacher, deleteTeacher } from '@/services/csv.service'
import { hasPermission } from '@/utils/permissions'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const teachers = await prisma.teacher.findMany({
      where: { tenantId: user.tenantId, deletedAt: null },
      orderBy: { surname: 'asc' },
    })

    return NextResponse.json(teachers)
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

    if (!hasPermission(user.role, 'profesores', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createTeacherSchema.parse(body)

    const teacher = await createTeacher(user.tenantId, data)
    return NextResponse.json(teacher, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
