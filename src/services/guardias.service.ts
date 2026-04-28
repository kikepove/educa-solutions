import prisma from '@/lib/db'
import type { CreateGuardDutyInput } from '@/utils/validation'

export async function createGuardDuty(
  tenantId: string,
  createdById: string,
  data: CreateGuardDutyInput
) {
  return prisma.guardDuty.create({
    data: {
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      type: data.type || 'ORDINARIA',
      notes: data.notes,
      teacherId: data.teacherId,
      substituteId: data.substituteId,
      tenantId,
      createdById,
    },
    include: {
      teacher: true,
      substitute: true,
      createdBy: {
        select: { id: true, name: true, surname: true },
      },
    },
  })
}

export async function getGuardDuties(
  tenantId: string,
  options?: {
    teacherId?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }
) {
  const where: any = { tenantId }

  if (options?.teacherId) where.teacherId = options.teacherId
  if (options?.startDate || options?.endDate) {
    where.date = {}
    if (options?.startDate) where.date.gte = options.startDate
    if (options?.endDate) where.date.lte = options.endDate
  }

  const [data, total] = await Promise.all([
    prisma.guardDuty.findMany({
      where,
      include: {
        teacher: true,
        substitute: true,
        createdBy: {
          select: { id: true, name: true, surname: true },
        },
      },
      orderBy: { date: 'asc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.guardDuty.count({ where }),
  ])

  return { data, total }
}

export async function getGuardDutyById(guardDutyId: string, tenantId: string) {
  return prisma.guardDuty.findFirst({
    where: { id: guardDutyId, tenantId },
    include: {
      teacher: true,
      substitute: true,
      createdBy: {
        select: { id: true, name: true, surname: true },
      },
    },
  })
}

export async function updateGuardDuty(
  guardDutyId: string,
  tenantId: string,
  data: Partial<CreateGuardDutyInput>
) {
  const guardDuty = await prisma.guardDuty.findFirst({
    where: { id: guardDutyId, tenantId },
  })

  if (!guardDuty) {
    throw new Error('Guardia no encontrada')
  }

  const updateData: any = { ...data }
  if (data.date) updateData.date = new Date(data.date)

  return prisma.guardDuty.update({
    where: { id: guardDutyId },
    data: updateData,
    include: {
      teacher: true,
      substitute: true,
    },
  })
}

export async function deleteGuardDuty(guardDutyId: string, tenantId: string) {
  return prisma.guardDuty.delete({
    where: { id: guardDutyId, tenantId },
  })
}

export async function getGuardDutyStats(tenantId: string, teacherId?: string) {
  const where: any = { tenantId }
  if (teacherId) where.teacherId = teacherId

  const [total, thisMonth, pending] = await Promise.all([
    prisma.guardDuty.count({ where }),
    prisma.guardDuty.count({
      where: {
        ...where,
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.guardDuty.count({
      where: {
        ...where,
        date: { gte: new Date() },
      },
    }),
  ])

  return { total, thisMonth, pending }
}
