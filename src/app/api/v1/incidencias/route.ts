import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
  getIncidentStats,
} from '@/services/incidencias.service'
import { createIncidentSchema, updateIncidentSchema } from '@/utils/validation'
import { hasPermission } from '@/utils/permissions'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const tenantId = user.tenantId || user.role === 'ADMIN' ? request.headers.get('x-tenant-id') : null
    if (!tenantId && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const options = {
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      category: searchParams.get('category') || undefined,
      classroomId: searchParams.get('classroomId') || undefined,
      technicianId: searchParams.get('technicianId') || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    const result = await getIncidents(tenantId!, options)
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

    if (!hasPermission(user.role, 'incidencias', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createIncidentSchema.parse(body)

    const incident = await createIncident(user.tenantId, user.id, data, user.role)
    return NextResponse.json(incident, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}