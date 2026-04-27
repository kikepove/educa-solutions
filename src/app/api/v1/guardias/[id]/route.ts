import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import {
  getGuardDutyById,
  updateGuardDuty,
  deleteGuardDuty,
} from '@/services/guardias.service'
import { createGuardDutySchema } from '@/utils/validation'
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

    const guardDuty = await getGuardDutyById(params.id, user.tenantId)
    if (!guardDuty) {
      return NextResponse.json({ error: 'Guardia no encontrada' }, { status: 404 })
    }

    return NextResponse.json(guardDuty)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'guardias', 'update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createGuardDutySchema.partial().parse(body)

    const guardDuty = await updateGuardDuty(params.id, user.tenantId, data)
    return NextResponse.json(guardDuty)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
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

    if (!hasPermission(user.role, 'guardias', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteGuardDuty(params.id, user.tenantId)
    return NextResponse.json({ message: 'Guardia eliminada' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}