import prisma from '@/lib/db'
import type { CreateReservationInput } from '@/utils/validation'

export async function createReservation(
  tenantId: string,
  userId: string,
  data: CreateReservationInput
) {
  const startTime = new Date(data.startTime)
  const endTime = new Date(data.endTime)

  if (startTime >= endTime) {
    throw new Error('La hora de fin debe ser posterior a la de inicio')
  }

  const conflicting = await prisma.reservation.findFirst({
    where: {
      classroomId: data.classroomId,
      status: { not: 'CANCELADA' },
      OR: [
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime },
        },
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime },
        },
      ],
    },
  })

  if (conflicting) {
    throw new Error('El aula ya está reservada en ese horario')
  }

  return prisma.reservation.create({
    data: {
      ...data,
      startTime,
      endTime,
      tenantId,
      userId,
    },
    include: {
      classroom: true,
      user: {
        select: { id: true, name: true, surname: true },
      },
    },
  })
}

export async function getReservations(
  tenantId: string,
  options?: {
    classroomId?: string
    userId?: string
    startDate?: Date
    endDate?: Date
    status?: string
    limit?: number
    offset?: number
  }
) {
  const where: any = { tenantId, deletedAt: null }

  if (options?.classroomId) where.classroomId = options.classroomId
  if (options?.userId) where.userId = options.userId
  if (options?.status) where.status = options.status

  if (options?.startDate || options?.endDate) {
    where.startTime = {}
    if (options?.startDate) where.startTime.gte = options.startDate
    if (options?.endDate) where.startTime.lte = options.endDate
  }

  const [data, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: {
        classroom: true,
        user: {
          select: { id: true, name: true, surname: true },
        },
      },
      orderBy: { startTime: 'asc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    }),
    prisma.reservation.count({ where }),
  ])

  return { data, total }
}

export async function getReservationById(reservationId: string, tenantId: string) {
  return prisma.reservation.findFirst({
    where: { id: reservationId, tenantId, deletedAt: null },
    include: {
      classroom: true,
      user: {
        select: { id: true, name: true, surname: true },
      },
    },
  })
}

export async function updateReservation(
  reservationId: string,
  tenantId: string,
  data: Partial<CreateReservationInput>
) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, tenantId },
  })

  if (!reservation) {
    throw new Error('Reserva no encontrada')
  }

  const updateData: any = { ...data }
  if (data.startTime) updateData.startTime = new Date(data.startTime)
  if (data.endTime) updateData.endTime = new Date(data.endTime)

  return prisma.reservation.update({
    where: { id: reservationId },
    data: updateData,
  })
}

export async function cancelReservation(reservationId: string, tenantId: string) {
  return prisma.reservation.update({
    where: { id: reservationId, tenantId },
    data: { status: 'CANCELADA' },
  })
}

export async function deleteReservation(reservationId: string, tenantId: string) {
  return prisma.reservation.update({
    where: { id: reservationId, tenantId },
    data: { deletedAt: new Date() },
  })
}

export async function getAvailableSlots(
  classroomId: string,
  date: Date,
  startHour: number = 8,
  endHour: number = 21
) {
  const dayStart = new Date(date)
  dayStart.setHours(startHour, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(endHour, 0, 0, 0)

  const reservations = await prisma.reservation.findMany({
    where: {
      classroomId,
      status: { not: 'CANCELADA' },
      startTime: { gte: dayStart },
      endTime: { lte: dayEnd },
    },
    orderBy: { startTime: 'asc' },
  })

  const slots: { start: string; end: string; available: boolean }[] = []
  let currentTime = startHour

  for (const res of reservations) {
    const resStart = res.startTime.getHours()
    const resEnd = res.endTime.getHours()

    if (resStart > currentTime) {
      slots.push({
        start: `${currentTime.toString().padStart(2, '0')}:00`,
        end: `${resStart.toString().padStart(2, '0')}:00`,
        available: true,
      })
    }
    currentTime = resEnd
  }

  if (currentTime < endHour) {
    slots.push({
      start: `${currentTime.toString().padStart(2, '0')}:00`,
      end: `${endHour.toString().padStart(2, '0')}:00`,
      available: true,
    })
  }

  return slots
}