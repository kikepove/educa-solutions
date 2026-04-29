import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createIncidentSchema } from '@/utils/validation'

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    // Verificar que el centro existe y está activo
    const tenant = await prisma.tenant.findFirst({
      where: {
        code: params.code,
        isActive: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Centro no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const data = createIncidentSchema.parse(body)

    // Crear incidencia sin usuario (pública)
    const incident = await prisma.incident.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIA',
        category: data.category || 'OTRO',
        location: data.location,
        classroomId: data.classroomId,
        tenantId: tenant.id,
        status: 'ABIERTA',
      },
    })

    return NextResponse.json(
      { message: 'Incidencia creada correctamente', id: incident.id },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
