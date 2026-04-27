import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryStats,
} from '@/services/inventario.service'
import { createInventoryItemSchema } from '@/utils/validation'
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
      const statsData = await getInventoryStats(user.tenantId)
      return NextResponse.json(statsData)
    }

    const options = {
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      classroomId: searchParams.get('classroomId') || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    const result = await getInventoryItems(user.tenantId, options)
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

    if (!hasPermission(user.role, 'inventario', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createInventoryItemSchema.parse(body)

    const technicianId = user.role === 'TECNICO' ? user.id : undefined
    const item = await createInventoryItem(user.tenantId, technicianId!, data)
    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}