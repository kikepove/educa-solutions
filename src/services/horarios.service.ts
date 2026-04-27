import prisma from '@/lib/db'
import type { CreateScheduleInput } from '@/utils/validation'
import { generateSchedule as generateScheduleEngine } from '@/lib/scheduling-engine'
import type { ScheduleGenerationResult } from '@/types/scheduling'

export async function createSchedule(
  tenantId: string,
  createdById: string,
  data: CreateScheduleInput
) {
  const existing = await prisma.schedule.findFirst({
    where: {
      tenantId,
      classroomId: data.classroomId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      day: data.day,
      startTime: data.startTime,
    },
  })

  if (existing) {
    throw new Error('Ya existe un horario conflictivo')
  }

  return prisma.schedule.create({
    data: {
      ...data,
      weekNumber: data.weekNumber,
      tenantId,
      createdById,
    },
    include: {
      classroom: true,
      subject: true,
      teacher: true,
      createdBy: {
        select: { id: true, name: true, surname: true },
      },
    },
  })
}

export async function getSchedules(
  tenantId: string,
  options?: {
    classroomId?: string
    teacherId?: string
    subjectId?: string
    day?: string
    weekNumber?: number
    limit?: number
    offset?: number
  }
) {
  const where: any = { tenantId }

  if (options?.classroomId) where.classroomId = options.classroomId
  if (options?.teacherId) where.teacherId = options.teacherId
  if (options?.subjectId) where.subjectId = options.subjectId
  if (options?.day) where.day = options.day
  if (options?.weekNumber) where.weekNumber = options.weekNumber

  const [data, total] = await Promise.all([
    prisma.schedule.findMany({
      where,
      include: {
        classroom: true,
        subject: true,
        teacher: true,
        createdBy: {
          select: { id: true, name: true, surname: true },
        },
      },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
      take: options?.limit || 100,
      skip: options?.offset || 0,
    }),
    prisma.schedule.count({ where }),
  ])

  return { data, total }
}

export async function getScheduleById(scheduleId: string, tenantId: string) {
  return prisma.schedule.findFirst({
    where: { id: scheduleId, tenantId },
    include: {
      classroom: true,
      subject: true,
      teacher: true,
    },
  })
}

export async function updateSchedule(
  scheduleId: string,
  tenantId: string,
  data: Partial<CreateScheduleInput>
) {
  const schedule = await prisma.schedule.findFirst({
    where: { id: scheduleId, tenantId },
  })

  if (!schedule) {
    throw new Error('Horario no encontrado')
  }

  return prisma.schedule.update({
    where: { id: scheduleId },
    data,
  })
}

export async function deleteSchedule(scheduleId: string, tenantId: string) {
  return prisma.schedule.delete({
    where: { id: scheduleId, tenantId },
  })
}

export async function clearSchedules(tenantId: string, classroomId?: string) {
  return prisma.schedule.deleteMany({
    where: {
      tenantId,
      classroomId,
      isGenerated: true,
    },
  })
}

export async function generateSchedulesAI(
  tenantId: string,
  createdById: string,
  classroomId: string,
  weekNumber: number = 1
) {
  // Usar el nuevo motor de generación
  const result = await generateScheduleEngine(tenantId, createdById, {
    maxConsecutiveHours: 3,
    daysPerWeek: 5,
    hoursPerDay: 7,
  })
  
  return result.generatedSlots
}

export async function generateScheduleAdvanced(
  tenantId: string,
  createdById: string,
  config?: {
    maxConsecutiveHours?: number
    daysPerWeek?: number
    hoursPerDay?: number
  }
): Promise<ScheduleGenerationResult> {
  return generateScheduleEngine(tenantId, createdById, config)
}

export async function getTeacherSchedule(teacherId: string, weekNumber?: number) {
  const where: any = { teacherId }
  if (weekNumber) where.weekNumber = weekNumber

  return prisma.schedule.findMany({
    where,
    include: {
      classroom: true,
      subject: true,
    },
    orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
  })
}
