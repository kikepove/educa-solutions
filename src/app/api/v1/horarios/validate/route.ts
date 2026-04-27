import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import { validateSchedule } from '@/lib/scheduling-engine'
import { hasPermission } from '@/utils/permissions'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'horarios', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const scheduleId = body.scheduleId || undefined

    const result = await validateSchedule(user.tenantId, scheduleId)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
