import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import { importClassrooms, importTeachers, getClassroomCSVTemplate, getTeacherCSVTemplate } from '@/services/csv.service'
import { hasPermission } from '@/utils/permissions'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'aulas') {
      return NextResponse.json({ template: getClassroomCSVTemplate() })
    } else if (type === 'profesores') {
      return NextResponse.json({ template: getTeacherCSVTemplate() })
    }

    return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 })
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'aulas') {
      if (!hasPermission(user.role, 'aulas', 'create')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (type === 'profesores') {
      if (!hasPermission(user.role, 'profesores', 'create')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    const csvContent = await file.text()

    let result
    if (type === 'aulas') {
      result = await importClassrooms(user.tenantId, csvContent)
    } else if (type === 'profesores') {
      result = await importTeachers(user.tenantId, csvContent)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
