import prisma from '@/lib/db'
import type { CreateScheduleInput } from '@/utils/validation'

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
  const [subjects, teachers, classroom] = await Promise.all([
    prisma.subject.findMany({ where: { tenantId } }),
    prisma.teacher.findMany({ where: { tenantId, isActive: true } }),
    prisma.classroom.findUnique({ where: { id: classroomId } }),
  ])

  if (!classroom) throw new Error('Aula no encontrada')
  if (subjects.length === 0) throw new Error('No hay asignaturas definidas')
  if (teachers.length === 0) throw new Error('No hay profesores disponibles')

  const days = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'] as const
  const hours = [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '11:30' },
    { start: '11:30', end: '12:30' },
    { start: '12:30', end: '13:30' },
    { start: '13:30', end: '14:30' },
  ]

  const scheduleSlots: Array<{
    day: typeof days[number]
    startTime: string
    endTime: string
    subjectId: string
    teacherId: string
  }> = []

  const availableSubjects = [...subjects]
  const usedSlots: Map<string, string[]> = new Map()

  for (const day of days) {
    for (let i = 0; i < hours.length; i++) {
      const hour = hours[i]
      if (hour.start === '11:00') continue

      let assigned = false
      let attempts = 0

      while (!assigned && attempts < 10) {
        const subjectIndex = Math.floor(Math.random() * availableSubjects.length)
        const subject = availableSubjects[subjectIndex]

        const teacherForSubject = teachers.find(
          (t) => !usedSlots.get(t.id)?.includes(`${day}-${hour.start}`)
        )

        if (teacherForSubject) {
          scheduleSlots.push({
            day,
            startTime: hour.start,
            endTime: hour.end,
            subjectId: subject.id,
            teacherId: teacherForSubject.id,
          })

          const teacherSlots = usedSlots.get(teacherForSubject.id) || []
          teacherSlots.push(`${day}-${hour.start}`)
          usedSlots.set(teacherForSubject.id, teacherSlots)

          assigned = true
        }

        attempts++
      }
    }
  }

  await prisma.$transaction(
    scheduleSlots.map((slot) =>
      prisma.schedule.create({
        data: {
          ...slot,
          weekNumber,
          isGenerated: true,
          classroomId,
          tenantId,
          createdById,
        },
      })
    )
  )

  return scheduleSlots.length
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