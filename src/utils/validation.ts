import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const createTenantSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug inválido'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
})

export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre es requerido'),
  surname: z.string().optional(),
  dni: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'TIC', 'PROFESOR', 'TECNICO', 'DIRECTOR']),
})

export const createClassroomSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().min(1, 'El código es requerido'),
  capacity: z.number().optional(),
  floor: z.number().optional(),
  building: z.string().optional(),
  description: z.string().optional(),
  hasProjector: z.boolean().optional(),
  hasComputer: z.boolean().optional(),
  hasWhiteboard: z.boolean().optional(),
})

export const createTeacherSchema = z.object({
  dni: z.string().min(1, 'El DNI es requerido'),
  name: z.string().min(2, 'El nombre es requerido'),
  surname: z.string().min(2, 'Los apellidos son requeridos'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  department: z.string().optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
})

export const createIncidentSchema = z.object({
  title: z.string().min(3, 'El título es requerido'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  priority: z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA']).optional(),
  category: z.enum(['HARDWARE', 'SOFTWARE', 'RED', 'AULA', 'OTRO']).optional(),
  location: z.string().optional(),
  classroomId: z.string().optional(),
  teacherId: z.string().optional(),
})

export const updateIncidentSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  status: z.enum(['ABIERTA', 'EN_PROCESO', 'RESUELTA', 'CERRADA']).optional(),
  priority: z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA']).optional(),
  category: z.enum(['HARDWARE', 'SOFTWARE', 'RED', 'AULA', 'OTRO']).optional(),
  location: z.string().optional(),
  solution: z.string().optional(),
  classroomId: z.string().optional(),
  technicianId: z.string().optional(),
  teacherId: z.string().optional(),
})

export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  assetTag: z.string().optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  status: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyEnd: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  classroomId: z.string().optional(),
})

export const createReservationSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  startTime: z.string().datetime('Fecha inválida'),
  endTime: z.string().datetime('Fecha inválida'),
  notes: z.string().optional(),
  classroomId: z.string().min(1, 'El aula es requerida'),
})

export const createScheduleSchema = z.object({
  day: z.enum(['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']),
  startTime: z.string().min(1, 'La hora de inicio es requerida'),
  endTime: z.string().min(1, 'La hora de fin es requerida'),
  weekNumber: z.number().optional(),
  notes: z.string().optional(),
  classroomId: z.string().min(1, 'El aula es requerida'),
  subjectId: z.string().min(1, 'La asignatura es requerida'),
  teacherId: z.string().min(1, 'El profesor es requerido'),
})

export const createGuardDutySchema = z.object({
  date: z.string().datetime('Fecha inválida'),
  startTime: z.string().min(1, 'La hora de inicio es requerida'),
  endTime: z.string().min(1, 'La hora de fin es requerida'),
  type: z.string().optional(),
  notes: z.string().optional(),
  teacherId: z.string().min(1, 'El profesor es requerido'),
  substituteId: z.string().optional(),
})

export const csvAulaSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  capacity: z.number().optional(),
  floor: z.number().optional(),
  building: z.string().optional(),
  hasProjector: z.boolean().optional(),
  hasComputer: z.boolean().optional(),
  hasWhiteboard: z.boolean().optional(),
})

export const csvProfesorSchema = z.object({
  dni: z.string().min(1),
  name: z.string().min(1),
  surname: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  department: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CreateTenantInput = z.infer<typeof createTenantSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type CreateClassroomInput = z.infer<typeof createClassroomSchema>
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>
export type CreateIncidentInput = z.infer<typeof createIncidentSchema>
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>
export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>
export type CreateReservationInput = z.infer<typeof createReservationSchema>
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>
export type CreateGuardDutyInput = z.infer<typeof createGuardDutySchema>