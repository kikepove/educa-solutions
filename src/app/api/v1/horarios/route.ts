import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import {
  createSchedule,
  getSchedules,
  generateSchedulesAI,
  getTeacherSchedule,
  generateScheduleAdvanced,
} from '@/services/horarios.service'
import { createScheduleSchema } from '@/utils/validation'
import { hasPermission } from '@/utils/permissions'
import type { ScheduleGenerationResult } from '@/types/scheduling'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teacherSchedule = searchParams.get('teacherSchedule')
    const generationId = searchParams.get('generationId')

    // Obtener estado de generación
    if (generationId) {
      const { prisma } = require('@/lib/db')
      const generation = await prisma.scheduleGeneration.findUnique({
        where: { id: generationId },
      })
      return NextResponse.json(generation)
    }

    if (teacherSchedule && user.role === 'PROFESOR') {
      const schedule = await getTeacherSchedule(user.id, parseInt(searchParams.get('weekNumber') || '1'))
      return NextResponse.json(schedule)
    }

    const tenantId = user.tenantId || request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 400 })
    }

    const options = {
      classroomId: searchParams.get('classroomId') || undefined,
      teacherId: searchParams.get('teacherId') || undefined,
      subjectId: searchParams.get('subjectId') || undefined,
      day: searchParams.get('day') || undefined,
      weekNumber: parseInt(searchParams.get('weekNumber') || '1'),
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    const result = await getSchedules(tenantId, options)
    return NextResponse.json(result)
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

    const { searchParams } = new URL(request.url)
    const generateAI = searchParams.get('generateAI')
    const generateAdvanced = searchParams.get('generateAdvanced')

    // Generación avanzada con el nuevo motor
    if (generateAdvanced === 'true') {
      const body = await request.json().catch(() => ({}))
      const result: ScheduleGenerationResult = await generateScheduleAdvanced(
        user.tenantId,
        user.id,
        body.config || {}
      )
      return NextResponse.json(result, { status: 200 })
    }

    if (generateAI === 'true') {
      const body = await request.json()
      const count = await generateSchedulesAI(
        user.tenantId,
        user.id,
        body.classroomId,
        body.weekNumber || 1
      )
      return NextResponse.json({ message: `${count} horarios generados`, count })
    }

    const body = await request.json()
    const data = createScheduleSchema.parse(body)

    const schedule = await createSchedule(user.tenantId, user.id, data)
    return NextResponse.json(schedule, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}