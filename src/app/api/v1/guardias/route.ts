import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import {
  createGuardDuty,
  getGuardDuties,
  getGuardDutyStats,
} from '@/services/guardias.service'
import { createGuardDutySchema } from '@/utils/validation'
import { hasPermission } from '@/utils/permissions'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const stats = searchParams.get('stats')

    if (stats === 'true') {
      const statsData = await getGuardDutyStats(
        user.tenantId,
        user.role === 'PROFESOR' ? user.id : undefined
      )
      return NextResponse.json(statsData)
    }

    const options = {
      teacherId: searchParams.get('teacherId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    const result = await getGuardDuties(user.tenantId, options)
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

    if (!hasPermission(user.role, 'guardias', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createGuardDutySchema.parse(body)

    const guardDuty = await createGuardDuty(user.tenantId, user.id, data)
    return NextResponse.json(guardDuty, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}