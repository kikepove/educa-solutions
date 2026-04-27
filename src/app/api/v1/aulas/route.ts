import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import { 
  createClassroom, 
  deleteClassroom 
} from '@/services/csv.service'
import prisma from '@/lib/db'
import { createClassroomSchema } from '@/utils/validation'
import { hasPermission } from '@/utils/permissions'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const classrooms = await prisma.classroom.findMany({
      where: { tenantId: user.tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(classrooms)
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

    if (!hasPermission(user.role, 'aulas', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createClassroomSchema.parse(body)

    const classroom = await createClassroom(user.tenantId, data)
    return NextResponse.json(classroom, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}