import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import { generateSchedule } from '@/lib/scheduling-engine'
import { hasPermission } from '@/utils/permissions'
import type { ScheduleGenerationResult } from '@/types/scheduling'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'horarios', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const config = body.config || {}

    // Generar horario con el motor avanzado
    const result: ScheduleGenerationResult = await generateSchedule(
      user.tenantId,
      user.id,
      config
    )

    return NextResponse.json(result, {
      status: result.status === 'COMPLETED' ? 200 : 400,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
