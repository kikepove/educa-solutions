export type UserRole = 'ADMIN' | 'TIC' | 'PROFESOR' | 'TECNICO' | 'DIRECTOR'

export interface User {
  id: string
  email: string
  name: string
  surname?: string
  dni?: string
  phone?: string
  avatar?: string
  role: UserRole
  isActive: boolean
  lastLogin?: string
  createdAt: string
  tenantId?: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  code: string
  address?: string
  phone?: string
  email?: string
  logo?: string
  qrUrl?: string
  isActive: boolean
  subscriptionStatus: string
}

export interface Classroom {
  id: string
  name: string
  code: string
  capacity?: number
  floor?: number
  building?: string
  description?: string
  hasProjector: boolean
  hasComputer: boolean
  hasWhiteboard: boolean
  isActive: boolean
}

export interface Teacher {
  id: string
  dni: string
  name: string
  surname: string
  email: string
  phone?: string
  department?: string
  isActive: boolean
}

export interface Technician {
  id: string
  dni: string
  name: string
  surname: string
  email: string
  phone?: string
  specialties?: string[]
  isActive: boolean
}

export interface Incident {
  id: string
  title: string
  description: string
  status: 'ABIERTA' | 'EN_PROCESO' | 'RESUELTA' | 'CERRADA'
  priority: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  category: 'HARDWARE' | 'SOFTWARE' | 'RED' | 'AULA' | 'OTRO'
  location?: string
  solution?: string
  resolvedAt?: string
  source: string
  createdAt: string
  classroomId?: string
  classroom?: Classroom
  teacherId?: string
  teacher?: Teacher
  technicianId?: string
  technician?: Technician
  createdById: string
  createdBy?: { id: string; name: string; surname?: string }
}

export interface InventoryItem {
  id: string
  name: string
  description?: string
  serialNumber?: string
  assetTag?: string
  category: string
  status: string
  purchaseDate?: string
  warrantyEnd?: string
  location?: string
  notes?: string
  imageUrl?: string
  classroomId?: string
  classroom?: Classroom
  technicianId?: string
}

export interface Reservation {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  status: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA'
  notes?: string
  classroomId: string
  classroom?: Classroom
  userId: string
  user?: { id: string; name: string; surname?: string }
}

export interface Schedule {
  id: string
  day: 'LUNES' | 'MARTES' | 'MERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO'
  startTime: string
  endTime: string
  weekNumber?: number
  classroomId: string
  classroom?: Classroom
  subjectId: string
  subject?: Subject
  teacherId: string
  teacher?: Teacher
}

export interface Subject {
  id: string
  name: string
  code: string
  color: string
}

export interface GuardDuty {
  id: string
  date: string
  startTime: string
  endTime: string
  type: string
  notes?: string
  isCompensated: boolean
  teacherId: string
  teacher?: Teacher
  substituteId?: string
  substitute?: Teacher
}

export interface ApiResponse<T> {
  data: T
  total?: number
}

export interface CSVImportResult {
  success: number
  errors: string[]
  total: number
}