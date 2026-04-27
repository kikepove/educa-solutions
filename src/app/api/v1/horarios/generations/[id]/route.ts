import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/utils/permissions'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'horarios', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const generation = await prisma.scheduleGeneration.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
      include: {
        schedules: {
          include: {
            classroom: true,
            subject: true,
            teacher: true,
          },
        },
        createdBy: {
          select: { id: true, name: true, surname: true },
        },
      },
    })

    if (!generation) {
      return NextResponse.json({ error: 'Generación no encontrada' }, { status: 404 })
    }

    return NextResponse.json(generation)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'horarios', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Eliminar horarios asociados y la generación
    await prisma.$transaction([
      prisma.schedule.deleteMany({
        where: {
          generationId: params.id,
          tenantId: user.tenantId,
        },
      }),
      prisma.scheduleGeneration.delete({
        where: {
          id: params.id,
          tenantId: user.tenantId,
        },
      }),
    ])

    return NextResponse.json({ message: 'Generación eliminada' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
