import prisma from './db'
import type {
  ScheduleSlot,
  SchedulingInput,
  TeacherInput,
  SubjectInput,
  ClassroomInput,
  ScheduleConflict,
  ValidationResult,
  ScheduleGenerationResult,
  ScheduleDay,
  ScheduleHour,
  ConstraintCategory,
} from '@/types/scheduling'

type SlotKey = string // `${day}-${hour}-${classroomId}`

export class SchedulingEngine {
  private tenantId: string
  private days: ScheduleDay[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
  private hours: ScheduleHour[] = [1, 2, 3, 4, 5, 6, 7]
  
  // Estado del horario
  private assignedSlots: Map<SlotKey, ScheduleSlot> = new Map()
  private teacherDayHours: Map<string, Set<string>> = new Map() // teacherId -> Set<`${day}-${hour}`>
  private classroomDayHours: Map<string, Set<string>> = new Map() // classroomId -> Set<`${day}-${hour}`>
  private teacherConsecutiveHours: Map<string, Map<ScheduleDay, number>> = new Map()
  private subjectAssignedHours: Map<string, number> = new Map() // subjectId -> horas asignadas

  constructor(tenantId: string) {
    this.tenantId = tenantId
  }

  /**
   * PASO 1: Algoritmo Greedy Heurístico para generación inicial
   */
  async generateGreedy(input: SchedulingInput): Promise<{
    slots: ScheduleSlot[]
    conflicts: ScheduleConflict[]
    score: number
  }> {
    this.resetState()

    // Ordenar materias por dificultad (más restrictivas primero)
    const sortedSubjects = [...input.subjects].sort((a, b) => {
      const difficultyA = a.difficulty || 5
      const difficultyB = b.difficulty || 5
      return difficultyB - difficultyA // Mayor dificultad primero
    })

    const conflicts: ScheduleConflict[] = []
    let totalScore = 0

    for (const subject of sortedSubjects) {
      const hoursNeeded = subject.hoursPerWeek
      let hoursAssigned = 0
      const maxAttempts = 100
      let attempts = 0

      while (hoursAssigned < hoursNeeded && attempts < maxAttempts) {
        attempts++

        // Encontrar el mejor slot para esta materia
        const bestSlot = this.findBestSlot(subject, input)

        if (!bestSlot) {
          conflicts.push({
            type: 'CONSTRAINT_VIOLATION',
            day: 'LUNES',
            hour: 1,
            subjectId: subject.id,
            description: `No se pudo asignar hora para ${subject.name} (${hoursAssigned}/${hoursNeeded})`,
          })
          break
        }

        // Verificar si el slot es válido
        const slotConflicts = this.validateSlot(bestSlot, input)
        if (slotConflicts.length === 0) {
          this.assignSlot(bestSlot)
          hoursAssigned++
          totalScore += 10 // Puntos por asignación exitosa
        } else {
          // Intentar siguiente mejor opción
          continue
        }
      }

      this.subjectAssignedHours.set(subject.id, hoursAssigned)
    }

    const slots = Array.from(this.assignedSlots.values())
    const validationResult = this.validateAll(slots, input)

    return {
      slots,
      conflicts: [...conflicts, ...validationResult.conflicts],
      score: totalScore + validationResult.score,
    }
  }

  /**
   * Encontrar el mejor slot para una materia
   */
  private findBestSlot(
    subject: SubjectInput,
    input: SchedulingInput
  ): ScheduleSlot | null {
    const availableSlots: {
      slot: ScheduleSlot
      score: number
    }[] = []

    for (const day of this.days) {
      for (const hour of this.hours) {
        // Encontrar profesor disponible
        const teacher = this.findAvailableTeacher(subject, day, hour, input)
        if (!teacher) continue

        // Encontrar aula disponible
        const classroom = this.findAvailableClassroom(subject, day, hour, input)
        if (!classroom) continue

        // Calcular puntuación del slot
        const score = this.calculateSlotScore(subject, teacher, classroom, day, hour, input)

        availableSlots.push({
          slot: {
            day,
            hour,
            classroomId: classroom.id,
            classroomName: classroom.name,
            subjectId: subject.id,
            subjectName: subject.name,
            teacherId: teacher.id,
            teacherName: teacher.name,
            tenantId: this.tenantId,
          },
          score,
        })
      }
    }

    if (availableSlots.length === 0) return null

    // Ordenar por puntuación (mayor primero)
    availableSlots.sort((a, b) => b.score - a.score)
    return availableSlots[0].slot
  }

  /**
   * Encontrar profesor disponible para una materia en un slot dado
   */
  private findAvailableTeacher(
    subject: SubjectInput,
    day: ScheduleDay,
    hour: ScheduleHour,
    input: SchedulingInput
  ): TeacherInput | null {
    const availableTeachers = input.teachers.filter(teacher => {
      // Verificar que no esté ocupado en ese día/hora
      const teacherKey = `${teacher.id}`
      const dayHourKey = `${day}-${hour}`
      
      if (this.teacherDayHours.get(teacherKey)?.has(dayHourKey)) {
        return false
      }

      // Verificar disponibilidad del profesor
      const availability = input.availabilities.find(
        a => a.teacherId === teacher.id && a.day === day
      )
      
      if (availability && !availability.isAvailable) {
        return false
      }

      // Verificar horas consecutivas
      const consecutiveHours = this.teacherConsecutiveHours.get(teacher.id)?.get(day) || 0
      const maxConsecutive = input.config.maxConsecutiveHours || 3
      
      if (consecutiveHours >= maxConsecutive) {
        return false
      }

      return true
    })

    if (availableTeachers.length === 0) return null

    // Preferir profesores con menos horas asignadas (balancear carga)
    availableTeachers.sort((a, b) => {
      const hoursA = this.getTeacherAssignedHours(a.id)
      const hoursB = this.getTeacherAssignedHours(b.id)
      return hoursA - hoursB
    })

    return availableTeachers[0]
  }

  /**
   * Encontrar aula disponible
   */
  private findAvailableClassroom(
    subject: SubjectInput,
    day: ScheduleDay,
    hour: ScheduleHour,
    input: SchedulingInput
  ): ClassroomInput | null {
    const availableClassrooms = input.classrooms.filter(classroom => {
      // Verificar que no esté ocupada
      const classroomKey = `${classroom.id}`
      const dayHourKey = `${day}-${hour}`
      
      if (this.classroomDayHours.get(classroomKey)?.has(dayHourKey)) {
        return false
      }

      // Verificar requisitos de aula de la materia
      if (subject.requiredClassroomType) {
        if (classroom.type !== subject.requiredClassroomType) {
          return false
        }
      }

      return true
    })

    if (availableClassrooms.length === 0) return null

    // Preferir aulas con menor capacidad necesaria (optimización de recursos)
    availableClassrooms.sort((a, b) => {
      const capA = a.capacity || 999
      const capB = b.capacity || 999
      return capA - capB
    })

    return availableClassrooms[0]
  }

  /**
   * Calcular puntuación de un slot
   */
  private calculateSlotScore(
    subject: SubjectInput,
    teacher: TeacherInput,
    classroom: ClassroomInput,
    day: ScheduleDay,
    hour: ScheduleHour,
    input: SchedulingInput
  ): number {
    let score = 0

    // PREFERENCIA: Evitar primeras/últimas horas (soft constraint)
    if (hour === 1 || hour === 7) {
      score -= 5
    } else {
      score += 5
    }

    // PREFERENCIA: Agrupar clases de una misma materia
    const currentSubjectHours = this.subjectAssignedHours.get(subject.id) || 0
    if (currentSubjectHours > 0) {
      // Penalizar si no está en días consecutivos (simplificado)
      score += 3
    }

    // PREFERENCIA: Minimizar huecos en profesor
    const teacherHours = this.getTeacherAssignedHours(teacher.id)
    if (teacherHours > 0) {
      score += 2
    }

    // PREFERENCIA: Balancear carga semanal
    score -= teacherHours * 0.5

    return score
  }

  /**
   * Asignar un slot al estado
   */
  private assignSlot(slot: ScheduleSlot): void {
    const key: SlotKey = `${slot.day}-${slot.hour}-${slot.classroomId}`
    this.assignedSlots.set(key, slot)

    // Actualizar estado del profesor
    const teacherKey = slot.teacherId
    if (!this.teacherDayHours.has(teacherKey)) {
      this.teacherDayHours.set(teacherKey, new Set())
    }
    this.teacherDayHours.get(teacherKey)!.add(`${slot.day}-${slot.hour}`)

    // Actualizar estado del aula
    const classroomKey = slot.classroomId
    if (!this.classroomDayHours.has(classroomKey)) {
      this.classroomDayHours.set(classroomKey, new Set())
    }
    this.classroomDayHours.get(classroomKey)!.add(`${slot.day}-${slot.hour}`)

    // Actualizar horas consecutivas
    if (!this.teacherConsecutiveHours.has(slot.teacherId)) {
      this.teacherConsecutiveHours.set(slot.teacherId, new Map())
    }
    const teacherDayMap = this.teacherConsecutiveHours.get(slot.teacherId)!
    const currentConsecutive = teacherDayMap.get(slot.day) || 0
    teacherDayMap.set(slot.day, currentConsecutive + 1)

    // Actualizar horas de materia
    const currentSubjectHours = this.subjectAssignedHours.get(slot.subjectId) || 0
    this.subjectAssignedHours.set(slot.subjectId, currentSubjectHours + 1)
  }

  /**
   * Validar un slot contra hard constraints
   */
  private validateSlot(slot: ScheduleSlot, input: SchedulingInput): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = []

    // HARD: Sin solapamiento de profesor
    const teacherKey = slot.teacherId
    if (this.teacherDayHours.get(teacherKey)?.has(`${slot.day}-${slot.hour}`)) {
      conflicts.push({
        type: 'TEACHER_OVERLAP',
        day: slot.day,
        hour: slot.hour,
        teacherId: slot.teacherId,
        description: `Profesor ${slot.teacherName} ya tiene clase en ${slot.day} hora ${slot.hour}`,
      })
    }

    // HARD: Sin solapamiento de aula
    const classroomKey = slot.classroomId
    if (this.classroomDayHours.get(classroomKey)?.has(`${slot.day}-${slot.hour}`)) {
      conflicts.push({
        type: 'CLASSROOM_OVERLAP',
        day: slot.day,
        hour: slot.hour,
        classroomId: slot.classroomId,
        description: `Aula ${slot.classroomName} ya está ocupada en ${slot.day} hora ${slot.hour}`,
      })
    }

    // HARD: Verificar disponibilidad
    const availability = input.availabilities.find(
      a => a.teacherId === slot.teacherId && a.day === slot.day
    )
    if (availability && !availability.isAvailable) {
      conflicts.push({
        type: 'TEACHER_UNAVAILABLE',
        day: slot.day,
        hour: slot.hour,
        teacherId: slot.teacherId,
        description: `Profesor ${slot.teacherName} no está disponible en ${slot.day}`,
      })
    }

    return conflicts
  }

  /**
   * Validar todos los slots
   */
  validateAll(slots: ScheduleSlot[], input: SchedulingInput): ValidationResult {
    const conflicts: ScheduleConflict[] = []
    let score = 0
    const warnings: string[] = []

    // Verificar hard constraints
    const teacherSlots: Map<string, { day: ScheduleDay; hour: ScheduleHour }[]> = new Map()
    const classroomSlots: Map<string, { day: ScheduleDay; hour: ScheduleHour }[]> = new Map()

    for (const slot of slots) {
      // Agrupar por profesor
      if (!teacherSlots.has(slot.teacherId)) {
        teacherSlots.set(slot.teacherId, [])
      }
      teacherSlots.get(slot.teacherId)!.push({ day: slot.day, hour: slot.hour })

      // Agrupar por aula
      if (!classroomSlots.has(slot.classroomId)) {
        classroomSlots.set(slot.classroomId, [])
      }
      classroomSlots.get(slot.classroomId)!.push({ day: slot.day, hour: slot.hour })
    }

    // Verificar solapamientos
    for (const [teacherId, slots] of teacherSlots) {
      const slotSet = new Set(slots.map(s => `${s.day}-${s.hour}`))
      if (slotSet.size < slots.length) {
        conflicts.push({
          type: 'TEACHER_OVERLAP',
          teacherId,
          description: `Profesor tiene solapamientos`,
        })
      }
    }

    for (const [classroomId, slots] of classroomSlots) {
      const slotSet = new Set(slots.map(s => `${s.day}-${s.hour}`))
      if (slotSet.size < slots.length) {
        conflicts.push({
          type: 'CLASSROOM_OVERLAP',
          classroomId,
          description: `Aula tiene solapamientos`,
        })
      }
    }

    // Verificar horas cumplidas por materia
    for (const subject of input.subjects) {
      const assignedHours = slots.filter(s => s.subjectId === subject.id).length
      if (assignedHours < subject.hoursPerWeek) {
        warnings.push(
          `Materia ${subject.name}: solo ${assignedHours}/${subject.hoursPerWeek} horas asignadas`
        )
      }
    }

    // Calcular score basado en soft constraints
    score = this.calculateSoftScore(slots, input)

    return {
      isValid: conflicts.length === 0,
      conflicts,
      score,
      warnings,
    }
  }

  /**
   * Calcular puntuación basada en soft constraints
   */
  private calculateSoftScore(slots: ScheduleSlot[], input: SchedulingInput): number {
    let score = 100 // Base score

    // Penalizar huecos en horarios de profesores
    const teacherDaySlots: Map<string, Map<ScheduleDay, ScheduleHour[]>> = new Map()
    
    for (const slot of slots) {
      const key = slot.teacherId
      if (!teacherDaySlots.has(key)) {
        teacherDaySlots.set(key, new Map())
      }
      const dayMap = teacherDaySlots.get(key)!
      if (!dayMap.has(slot.day)) {
        dayMap.set(slot.day, [])
      }
      dayMap.get(slot.day)!.push(slot.hour)
    }

    for (const [teacherId, dayMap] of teacherDaySlots) {
      for (const [day, hours] of dayMap) {
        const sortedHours = hours.sort((a, b) => a - b)
        
        // Contar huecos
        for (let i = 1; i < sortedHours.length; i++) {
          if (sortedHours[i] - sortedHours[i - 1] > 1) {
            score -= 2 // Penalización por hueco
          }
        }
      }
    }

    // Bonus por agrupación de materias
    const subjectDayCount: Map<string, Set<ScheduleDay>> = new Map()
    for (const slot of slots) {
      if (!subjectDayCount.has(slot.subjectId)) {
        subjectDayCount.set(slot.subjectId, new Set())
      }
      subjectDayCount.get(slot.subjectId)!.add(slot.day)
    }

    return Math.max(0, score)
  }

  /**
   * Optimización con Simulated Annealing
   */
  async optimize(
    slots: ScheduleSlot[],
    input: SchedulingInput,
    config?: { iterations?: number; temperature?: number; coolingRate?: number }
  ): Promise<{ slots: ScheduleSlot[]; score: number }> {
    const iterations = config?.iterations || 1000
    let temperature = config?.temperature || 100
    const coolingRate = config?.coolingRate || 0.995

    let currentSlots = [...slots]
    let bestSlots = [...currentSlots]
    let currentScore = this.calculateSoftScore(currentSlots, input)
    let bestScore = currentScore

    for (let i = 0; i < iterations; i++) {
      // Generar nuevo estado (intercambiar dos slots)
      const newSlots = this.generateNeighbor(currentSlots, input)
      const newScore = this.calculateSoftScore(newSlots, input)

      // Decidir si aceptar el nuevo estado
      if (newScore > currentScore) {
        currentSlots = newSlots
        currentScore = newScore
        
        if (newScore > bestScore) {
          bestSlots = [...newSlots]
          bestScore = newScore
        }
      } else {
        const delta = newScore - currentScore
        const probability = Math.exp(delta / temperature)
        
        if (Math.random() < probability) {
          currentSlots = newSlots
          currentScore = newScore
        }
      }

      temperature *= coolingRate
    }

    return { slots: bestSlots, score: bestScore }
  }

  /**
   * Generar un vecino (intercambiar dos slots)
   */
  private generateNeighbor(slots: ScheduleSlot[], input: SchedulingInput): ScheduleSlot[] {
    const newSlots = [...slots]
    
    if (newSlots.length < 2) return newSlots

    // Intercambiar profesor o aula de dos slots aleatorios
    const idx1 = Math.floor(Math.random() * newSlots.length)
    let idx2 = Math.floor(Math.random() * newSlots.length)
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * newSlots.length)
    }

    // Intentar intercambiar profesores
    const tempTeacher = newSlots[idx1].teacherId
    newSlots[idx1].teacherId = newSlots[idx2].teacherId
    newSlots[idx2].teacherId = tempTeacher

    // Verificar que no haya conflictos
    const validation = this.validateAll(newSlots, input)
    if (!validation.isValid) {
      // Revertir si hay conflictos
      newSlots[idx1].teacherId = newSlots[idx2].teacherId
      newSlots[idx2].teacherId = tempTeacher
    }

    return newSlots
  }

  /**
   * Obtener horas asignadas a un profesor
   */
  private getTeacherAssignedHours(teacherId: string): number {
    let count = 0
    for (const slot of this.assignedSlots.values()) {
      if (slot.teacherId === teacherId) {
        count++
      }
    }
    return count
  }

  /**
   * Reiniciar estado
   */
  private resetState(): void {
    this.assignedSlots.clear()
    this.teacherDayHours.clear()
    this.classroomDayHours.clear()
    this.teacherConsecutiveHours.clear()
    this.subjectAssignedHours.clear()
  }
}

/**
 * Función principal para generar horario completo
 */
export async function generateSchedule(
  tenantId: string,
  createdById: string,
  config?: {
    maxConsecutiveHours?: number
    daysPerWeek?: number
    hoursPerDay?: number
  }
): Promise<ScheduleGenerationResult> {
  // Crear registro de generación
  const generation = await prisma.scheduleGeneration.create({
    data: {
      tenantId,
      createdById,
      status: 'IN_PROGRESS',
      totalSlots: 0,
      message: 'Iniciando generación...',
    },
  })

  try {
    // Cargar datos
    const [subjects, teachers, classrooms, availabilities] = await Promise.all([
      prisma.subject.findMany({ where: { tenantId } }),
      prisma.teacher.findMany({ where: { tenantId, isActive: true } }),
      prisma.classroom.findMany({ where: { tenantId, isActive: true } }),
      prisma.teacherAvailability.findMany({ where: { tenantId } }),
    ])

    if (subjects.length === 0) {
      throw new Error('No hay asignaturas definidas')
    }

    const input: SchedulingInput = {
      tenantId,
      teachers: teachers.map(t => ({
        id: t.id,
        name: `${t.name} ${t.surname}`,
        maxHoursPerDay: 6,
        maxConsecutiveHours: config?.maxConsecutiveHours || 3,
      })),
      subjects: subjects.map(s => ({
        id: s.id,
        name: s.name,
        code: s.code,
        hoursPerWeek: 3, // Por defecto, debería venir de la materia
        difficulty: 5,
      })),
      classrooms: classrooms.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        type: c.hasComputer ? 'INFORMATICA' : undefined,
      })),
      availabilities: availabilities.map(a => ({
        teacherId: a.teacherId,
        day: a.day as ScheduleDay,
        hourStart: a.hourStart,
        hourEnd: a.hourEnd,
        isAvailable: a.isAvailable,
      })),
      constraints: [],
      config: {
        daysPerWeek: config?.daysPerWeek || 5,
        hoursPerDay: config?.hoursPerDay || 7,
        maxConsecutiveHours: config?.maxConsecutiveHours || 3,
      },
    }

    const engine = new SchedulingEngine(tenantId)
    
    // Paso 1: Generación greedy
    const greedyResult = await engine.generateGreedy(input)
    
    // Paso 2: Optimización
    const optimizedResult = await engine.optimize(greedyResult.slots, input, {
      iterations: 500,
      temperature: 50,
      coolingRate: 0.99,
    })

    // Guardar slots en base de datos
    const savedSlots = await prisma.$transaction(
      optimizedResult.slots.map(slot =>
        prisma.schedule.create({
          data: {
            day: slot.day,
            startTime: `${slot.hour}:00`,
            endTime: `${slot.hour + 1}:00`,
            tenantId,
            classroomId: slot.classroomId,
            subjectId: slot.subjectId,
            teacherId: slot.teacherId,
            createdById,
            generationId: generation.id,
            isGenerated: true,
          },
        })
      )
    )

    // Actualizar generación
    await prisma.scheduleGeneration.update({
      where: { id: generation.id },
      data: {
        status: 'COMPLETED',
        progress: 100,
        score: optimizedResult.score,
        generatedSlots: savedSlots.length,
        totalSlots: input.subjects.reduce((acc, s) => acc + s.hoursPerWeek, 0),
        completedAt: new Date(),
        message: 'Generación completada exitosamente',
      },
    })

    return {
      generationId: generation.id,
      status: 'COMPLETED',
      score: optimizedResult.score,
      conflictCount: greedyResult.conflicts.length,
      generatedSlots: savedSlots.length,
      totalSlots: input.subjects.reduce((acc, s) => acc + s.hoursPerWeek, 0),
      slots: savedSlots.map(s => ({
        id: s.id,
        day: s.day as ScheduleDay,
        hour: parseInt(s.startTime) as ScheduleHour,
        classroomId: s.classroomId,
        subjectId: s.subjectId,
        teacherId: s.teacherId,
        tenantId: s.tenantId,
      })),
      message: 'Generación completada',
    }
  } catch (error: any) {
    await prisma.scheduleGeneration.update({
      where: { id: generation.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        message: error.message,
      },
    })

    return {
      generationId: generation.id,
      status: 'FAILED',
      score: 0,
      conflictCount: 1,
      generatedSlots: 0,
      totalSlots: 0,
      slots: [],
      message: error.message,
    }
  }
}

/**
 * Validar horario existente
 */
export async function validateSchedule(
  tenantId: string,
  scheduleId?: string
): Promise<ValidationResult> {
  const where: any = { tenantId }
  if (scheduleId) where.id = scheduleId

  const slots = await prisma.schedule.findMany({
    where,
    include: {
      classroom: true,
      subject: true,
      teacher: true,
    },
  })

  const engine = new SchedulingEngine(tenantId)
  const scheduleSlots: ScheduleSlot[] = slots.map(s => ({
    id: s.id,
    day: s.day as ScheduleDay,
    hour: parseInt(s.startTime) as ScheduleHour,
    classroomId: s.classroomId,
    classroomName: s.classroom.name,
    subjectId: s.subjectId,
    subjectName: s.subject.name,
    teacherId: s.teacherId,
    teacherName: `${s.teacher.name} ${s.teacher.surname}`,
    tenantId: s.tenantId,
  }))

  // Cargar input para validación
  const [subjects, teachers, classrooms] = await Promise.all([
    prisma.subject.findMany({ where: { tenantId } }),
    prisma.teacher.findMany({ where: { tenantId } }),
    prisma.classroom.findMany({ where: { tenantId } }),
  ])

  const input: SchedulingInput = {
    tenantId,
    teachers: teachers.map(t => ({
      id: t.id,
      name: `${t.name} ${t.surname}`,
    })),
    subjects: subjects.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      hoursPerWeek: 3,
    })),
    classrooms: classrooms.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
    })),
    availabilities: [],
    constraints: [],
    config: {
      daysPerWeek: 5,
      hoursPerDay: 7,
      maxConsecutiveHours: 3,
    },
  }

  return engine.validateAll(scheduleSlots, input)
}
