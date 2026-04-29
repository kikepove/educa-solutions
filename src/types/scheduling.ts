// Tipos para el sistema de generación de horarios

export type ScheduleDay = 'LUNES' | 'MARTES' | 'MERCOLES' | 'JUEVES' | 'VIERNES'
export type ScheduleHour = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface ScheduleSlot {
  id?: string
  day: ScheduleDay
  hour: ScheduleHour
  classroomId: string
  classroomName?: string
  subjectId: string
  subjectName?: string
  teacherId: string
  teacherName?: string
  tenantId: string
  generationId?: string
}

export interface TeacherAvailability {
  teacherId: string
  day: ScheduleDay
  hourStart: number
  hourEnd: number
  isAvailable: boolean
}

export interface ScheduleConstraint {
  id?: string
  type: 'HARD' | 'SOFT'
  category: ConstraintCategory
  description?: string
  weight: number
  isActive: boolean
  config?: Record<string, any>
}

export type ConstraintCategory =
  | 'NO_OVERLAP_TEACHER'
  | 'NO_OVERLAP_CLASSROOM'
  | 'TEACHER_AVAILABILITY'
  | 'CLASSROOM_REQUIREMENTS'
  | 'MAX_CONSECUTIVE_HOURS'
  | 'MINIMIZE_GAPS'
  | 'GROUP_SAME_SUBJECT'
  | 'AVOID_FIRST_LAST_HOURS'
  | 'BALANCE_WEEKLY_LOAD'

export interface ScheduleGenerationRequest {
  tenantId: string
  createdById: string
  totalSlots: number
  config?: {
    maxConsecutiveHours?: number
    maxGapsPerDay?: number
    preferMorning?: boolean
    balanceLoad?: boolean
  }
}

export interface ScheduleGenerationResult {
  generationId: string
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL'
  score: number
  conflictCount: number
  generatedSlots: number
  totalSlots: number
  slots: ScheduleSlot[]
  message?: string
}

export interface ValidationResult {
  isValid: boolean
  conflicts: ScheduleConflict[]
  score: number
  warnings: string[]
}

export interface ScheduleConflict {
  type: 'TEACHER_OVERLAP' | 'CLASSROOM_OVERLAP' | 'TEACHER_UNAVAILABLE' | 'CONSTRAINT_VIOLATION'
  day: ScheduleDay
  hour: ScheduleHour
  teacherId?: string
  classroomId?: string
  subjectId?: string
  description: string
}

export interface OptimizationConfig {
  algorithm: 'SIMULATED_ANNEALING' | 'HILL_CLIMBING' | 'GENETIC'
  iterations: number
  temperature?: number
  coolingRate?: number
}

// Datos de entrada para el algoritmo
export interface SchedulingInput {
  tenantId: string
  teachers: TeacherInput[]
  subjects: SubjectInput[]
  classrooms: ClassroomInput[]
  availabilities: TeacherAvailability[]
  constraints: ScheduleConstraint[]
  config: {
    daysPerWeek: number
    hoursPerDay: number
    maxConsecutiveHours: number
  }
}

export interface TeacherInput {
  id: string
  name: string
  maxHoursPerDay?: number
  maxConsecutiveHours?: number
}

export interface SubjectInput {
  id: string
  name: string
  code: string
  hoursPerWeek: number
  requiredClassroomType?: string // 'INFORMATICA', 'LABORATORIO', etc.
  difficulty?: number // 1-10, para priorizar
}

export interface ClassroomInput {
  id: string
  name: string
  code: string
  type?: string
  capacity?: number
}
