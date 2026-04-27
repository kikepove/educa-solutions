import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import {
  getIncidentById,
  updateIncident,
  deleteIncident,
} from '@/services/incidencias.service'
import { updateIncidentSchema } from '@/utils/validation'
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

    const incident = await getIncidentById(params.id, user.tenantId)
    if (!incident) {
      return NextResponse.json({ error: 'Incidencia no encontrada' }, { status: 404 })
    }

    return NextResponse.json(incident)
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

    if (!hasPermission(user.role, 'incidencias', 'update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateIncidentSchema.parse(body)

    const incident = await updateIncident(params.id, user.tenantId, data, user.role, user.id)
    return NextResponse.json(incident)
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

    if (!hasPermission(user.role, 'incidencias', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteIncident(params.id, user.tenantId)
    return NextResponse.json({ message: 'Incidencia eliminada' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}