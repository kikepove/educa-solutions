import prisma from '@/lib/db'
import { parseCSV, generateCSVTemplate } from '@/utils/csv-parser'
import {
  createClassroomSchema,
  csvAulaSchema,
  createTeacherSchema,
  csvProfesorSchema,
} from '@/utils/validation'
import type { CreateClassroomInput, CreateTeacherInput } from '@/utils/validation'

export async function importClassrooms(tenantId: string, csvContent: string) {
  const result = parseCSV(csvContent, csvAulaSchema, ['name', 'code'])

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`Error al parsear CSV: ${result.errors[0].message}`)
  }

  const created: any[] = []
  const errors: string[] = []

  await prisma.$transaction(async (tx) => {
    for (const item of result.data) {
      try {
        const existing = await tx.classroom.findFirst({
          where: { tenantId, code: item.code },
        })

        if (existing) {
          errors.push(`Aula ${item.code} ya existe`)
          continue
        }

        const classroom = await tx.classroom.create({
          data: {
            ...item,
            tenantId,
          },
        })
        created.push(classroom)
      } catch (error: any) {
        errors.push(`Error creando aula ${item.code}: ${error.message}`)
      }
    }
  })

  return {
    success: created.length,
    errors,
    total: result.data.length,
  }
}

export async function importTeachers(tenantId: string, csvContent: string) {
  const result = parseCSV(csvContent, csvProfesorSchema, ['dni', 'name', 'surname', 'email'])

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`Error al parsear CSV: ${result.errors[0].message}`)
  }

  const created: any[] = []
  const errors: string[] = []

  await prisma.$transaction(async (tx) => {
    for (const item of result.data) {
      try {
        const existing = await tx.teacher.findFirst({
          where: { tenantId, dni: item.dni },
        })

        if (existing) {
          errors.push(`Profesor con DNI ${item.dni} ya existe`)
          continue
        }

        const teacher = await tx.teacher.create({
          data: {
            ...item,
            tenantId,
          },
        })
        created.push(teacher)

        const userExists = await tx.user.findUnique({
          where: { email: item.email },
        })

        if (!userExists) {
          const bcrypt = require('bcryptjs')
          const tempPassword = Math.random().toString(36).slice(-8)
          
          await tx.user.create({
            data: {
              email: item.email,
              name: item.name,
              surname: item.surname,
              dni: item.dni,
              role: 'PROFESOR',
              password: await bcrypt.hash(tempPassword, 12),
              tenantId,
            },
          })
        }
      } catch (error: any) {
        errors.push(`Error creando profesor ${item.dni}: ${error.message}`)
      }
    }
  })

  return {
    success: created.length,
    errors,
    total: result.data.length,
  }
}

export async function exportClassrooms(tenantId: string) {
  const classrooms = await prisma.classroom.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { name: 'asc' },
  })

  return classrooms.map((c) => ({
    name: c.name,
    code: c.code,
    capacity: c.capacity,
    floor: c.floor,
    building: c.building,
    hasProjector: c.hasProjector,
    hasComputer: c.hasComputer,
    hasWhiteboard: c.hasWhiteboard,
  }))
}

export async function exportTeachers(tenantId: string) {
  const teachers = await prisma.teacher.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { surname: 'asc' },
  })

  return teachers.map((t) => ({
    dni: t.dni,
    name: t.name,
    surname: t.surname,
    email: t.email,
    phone: t.phone,
    department: t.department,
  }))
}

export function getClassroomCSVTemplate() {
  return generateCSVTemplate(['name', 'code', 'capacity', 'floor', 'building', 'hasProjector', 'hasComputer', 'hasWhiteboard'])
}

export function getTeacherCSVTemplate() {
  return generateCSVTemplate(['dni', 'name', 'surname', 'email', 'phone', 'department'])
}

export async function createClassroom(tenantId: string, data: CreateClassroomInput) {
  const existing = await prisma.classroom.findFirst({
    where: { tenantId, code: data.code },
  })

  if (existing) {
    throw new Error('Ya existe un aula con ese código')
  }

  return prisma.classroom.create({
    data: {
      ...data,
      tenantId,
    },
  })
}

export async function updateClassroom(
  classroomId: string,
  tenantId: string,
  data: Partial<CreateClassroomInput>
) {
  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, tenantId },
  })

  if (!classroom) {
    throw new Error('Aula no encontrada')
  }

  return prisma.classroom.update({
    where: { id: classroomId },
    data,
  })
}

export async function deleteClassroom(classroomId: string, tenantId: string) {
  return prisma.classroom.update({
    where: { id: classroomId, tenantId },
    data: { deletedAt: new Date() },
  })
}

export async function createTeacher(tenantId: string, data: CreateTeacherInput) {
  const existing = await prisma.teacher.findFirst({
    where: { tenantId, dni: data.dni },
  })

  if (existing) {
    throw new Error('Ya existe un profesor con ese DNI')
  }

  return prisma.teacher.create({
    data: {
      ...data,
      tenantId,
    },
  })
}

export async function updateTeacher(
  teacherId: string,
  tenantId: string,
  data: Partial<CreateTeacherInput>
) {
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, tenantId },
  })

  if (!teacher) {
    throw new Error('Profesor no encontrado')
  }

  return prisma.teacher.update({
    where: { id: teacherId },
    data,
  })
}

export async function deleteTeacher(teacherId: string, tenantId: string) {
  return prisma.teacher.update({
    where: { id: teacherId, tenantId },
    data: { deletedAt: new Date() },
  })
}
