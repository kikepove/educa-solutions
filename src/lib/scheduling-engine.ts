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
  private days: ScheduleDay[] = ['LUNES', 'MARTES', 'MERCOLES', 'JUEVES', 'VIERNES']
  private hours: ScheduleHour[] = [1, 2, 3, 4, 5, 6, 7]
  
  // Estado del horario
  private assignedSlots: Map<SlotKey, ScheduleSlot> = new Map()
  private teacherDayHours: Map<string, Set<string>> = new Map()
  private classroomDayHours: Map<string, Set<string>> = new Map()
  private teacherConsecutiveHours: Map<string, Map<ScheduleDay, number>> = new Map()
  private subjectAssignedHours: Map<string, number> = new Map()

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

    const sortedSubjects = [...input.subjects].sort((a, b) => {
      const difficultyA = a.difficulty || 5
      const difficultyB = b.difficulty || 5
      return difficultyB - difficultyA
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

        const slotConflicts = this.validateSlot(bestSlot, input)
        if (slotConflicts.length === 0) {
          this.assignSlot(bestSlot)
          hoursAssigned++
          totalScore += 10
        } else {
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

  private findBestSlot(
    subject: SubjectInput,
    input: SchedulingInput
  ): ScheduleSlot | null {
    const availableSlots: { slot: ScheduleSlot; score: number }[] = []

    for (const day of this.days) {
      for (const hour of this.hours) {
        const teacher = this.findAvailableTeacher(subject, day, hour, input)
        if (!teacher) continue

        const classroom = this.findAvailableClassroom(subject, day, hour, input)
        if (!classroom) continue

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

    availableSlots.sort((a, b) => b.score - a.score)
    return availableSlots[0].slot
  }

  private findAvailableTeacher(
    subject: SubjectInput,
    day: ScheduleDay,
    hour: ScheduleHour,
    input: SchedulingInput
  ): TeacherInput | null {
    const availableTeachers = input.teachers.filter(teacher => {
      const teacherKey = `${teacher.id}`
      const dayHourKey = `${day}-${hour}`
      
      if (this.teacherDayHours.get(teacherKey)?.has(dayHourKey)) {
        return false
      }

      const availability = input.availabilities.find(
        a => a.teacherId === teacher.id && a.day === day
      )
      
      if (availability && !availability.isAvailable) {
        return false
      }

      const consecutiveHours = this.teacherConsecutiveHours.get(teacher.id)?.get(day) || 0
      const maxConsecutive = input.config.maxConsecutiveHours || 3
      
      if (consecutiveHours >= maxConsecutive) {
        return false
      }

      return true
    })

    if (availableTeachers.length === 0) return null

    availableTeachers.sort((a, b) => {
      const hoursA = this.getTeacherAssignedHours(a.id)
      const hoursB = this.getTeacherAssignedHours(b.id)
      return hoursA - hoursB
    })

    return availableTeachers[0]
  }

  private findAvailableClassroom(
    subject: SubjectInput,
    day: ScheduleDay,
    hour: ScheduleHour,
    input: SchedulingInput
  ): ClassroomInput | null {
    const availableClassrooms = input.classrooms.filter(classroom => {
      const classroomKey = `${classroom.id}`
      const dayHourKey = `${day}-${hour}`
      
      if (this.classroomDayHours.get(classroomKey)?.has(dayHourKey)) {
        return false
      }

      if (subject.requiredClassroomType) {
        if (classroom.type !== subject.requiredClassroomType) {
          return false
        }
      }

      return true
    })

    if (availableClassrooms.length === 0) return null

    availableClassrooms.sort((a, b) => {
      const capA = a.capacity || 999
      const capB = b.capacity || 999
      return capA - capB
    })

    return availableClassrooms[0]
  }

  private calculateSlotScore(
    subject: SubjectInput,
    teacher: TeacherInput,
    classroom: ClassroomInput,
    day: ScheduleDay,
    hour: ScheduleHour,
    input: SchedulingInput
  ): number {
    let score = 0

    if (hour === 1 || hour === 7) {
      score -= 5
    } else {
      score += 5
    }

    const currentSubjectHours = this.subjectAssignedHours.get(subject.id) || 0
    if (currentSubjectHours > 0) {
      score += 3
    }

    const teacherHours = this.getTeacherAssignedHours(teacher.id)
    if (teacherHours > 0) {
      score += 2
    }

    score -= teacherHours * 0.5

    return score
  }

  private assignSlot(slot: ScheduleSlot): void {
    const key: SlotKey = `${slot.day}-${slot.hour}-${slot.classroomId}`
    this.assignedSlots.set(key, slot)

    const teacherKey = slot.teacherId
    if (!this.teacherDayHours.has(teacherKey)) {
      this.teacherDayHours.set(teacherKey, new Set())
    }
    this.teacherDayHours.get(teacherKey)!.add(`${slot.day}-${slot.hour}`)

    const classroomKey = slot.classroomId
    if (!this.classroomDayHours.has(classroomKey)) {
      this.classroomDayHours.set(classroomKey, new Set())
    }
    this.classroomDayHours.get(classroomKey)!.add(`${slot.day}-${slot.hour}`)

    if (!this.teacherConsecutiveHours.has(slot.teacherId)) {
      this.teacherConsecutiveHours.set(slot.teacherId, new Map())
    }
    const teacherDayMap = this.teacherConsecutiveHours.get(slot.teacherId)!
    const currentConsecutive = teacherDayMap.get(slot.day) || 0
    teacherDayMap.set(slot.day, currentConsecutive + 1)

    const currentSubjectHours = this.subjectAssignedHours.get(slot.subjectId) || 0
    this.subjectAssignedHours.set(slot.subjectId, currentSubjectHours + 1)
  }

  private validateSlot(slot: ScheduleSlot, input: SchedulingInput): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = []

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

  validateAll(slots: ScheduleSlot[], input: SchedulingInput): ValidationResult {
    const conflicts: ScheduleConflict[] = []
    let score = 0
    const warnings: string[] = []

    const teacherDayMap: { [key: string]: { [day: string]: ScheduleHour[] } } = {}
    const classroomDayMap: { [key: string]: { [day: string]: ScheduleHour[] } } = {}

    for (const slot of slots) {
      if (!teacherDayMap[slot.teacherId]) teacherDayMap[slot.teacherId] = {}
      if (!teacherDayMap[slot.teacherId][slot.day]) teacherDayMap[slot.teacherId][slot.day] = []
      teacherDayMap[slot.teacherId][slot.day].push(slot.hour)

      if (!classroomDayMap[slot.classroomId]) classroomDayMap[slot.classroomId] = {}
      if (!classroomDayMap[slot.classroomId][slot.day]) classroomDayMap[slot.classroomId][slot.day] = []
      classroomDayMap[slot.classroomId][slot.day].push(slot.hour)
    }

    for (const teacherId in teacherDayMap) {
      for (const day in teacherDayMap[teacherId]) {
        const hours = teacherDayMap[teacherId][day]
        const sortedHours = [...hours].sort((a, b) => a - b)
        
        for (let i = 1; i < sortedHours.length; i++) {
          if (sortedHours[i] - sortedHours[i - 1] > 1) {
            conflicts.push({
              type: 'TEACHER_OVERLAP',
              day: day as ScheduleDay,
              hour: sortedHours[i],
              teacherId,
              description: `Profesor tiene hueco entre horas ${sortedHours[i-1]} y ${sortedHours[i]}`,
            })
          }
        }
      }
    }

    for (const classroomId in classroomDayMap) {
      for (const day in classroomDayMap[classroomId]) {
        const hours = classroomDayMap[classroomId][day]
        const slotSet = new Set(hours.map(h => `${h}`))
        if (slotSet.size < hours.length) {
          conflicts.push({
            type: 'CLASSROOM_OVERLAP',
            day: day as ScheduleDay,
            hour: hours[0],
            classroomId,
            description: `Aula tiene solapamientos`,
          })
        }
      }
    }

    for (const subject of input.subjects) {
      const assignedHours = slots.filter(s => s.subjectId === subject.id).length
      if (assignedHours < subject.hoursPerWeek) {
        warnings.push(
          `Materia ${subject.name}: solo ${assignedHours}/${subject.hoursPerWeek} horas asignadas`
        )
      }
    }

    score = this.calculateSoftScore(slots, input)

    return {
      isValid: conflicts.length === 0,
      conflicts,
      score,
      warnings,
    }
  }

  private calculateSoftScore(slots: ScheduleSlot[], input: SchedulingInput): number {
    let score = 100

    const teacherDayMap: { [key: string]: { [day: string]: ScheduleHour[] } } = {}

    for (const slot of slots) {
      if (!teacherDayMap[slot.teacherId]) teacherDayMap[slot.teacherId] = {}
      if (!teacherDayMap[slot.teacherId][slot.day]) teacherDayMap[slot.teacherId][slot.day] = []
      teacherDayMap[slot.teacherId][slot.day].push(slot.hour)
    }

    for (const teacherId in teacherDayMap) {
      for (const day in teacherDayMap[teacherId]) {
        const hours = teacherDayMap[teacherId][day].sort((a, b) => a - b)
        
        for (let i = 1; i < hours.length; i++) {
          if (hours[i] - hours[i - 1] > 1) {
            score -= 2
          }
        }
      }
    }

    const subjectDayCount: { [key: string]: Set<ScheduleDay> } = {}
    for (const slot of slots) {
      if (!subjectDayCount[slot.subjectId]) subjectDayCount[slot.subjectId] = new Set()
      subjectDayCount[slot.subjectId].add(slot.day)
    }

    return Math.max(0, score)
  }

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
      const newSlots = this.generateNeighbor(currentSlots, input)
      const newScore = this.calculateSoftScore(newSlots, input)

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

  private generateNeighbor(slots: ScheduleSlot[], input: SchedulingInput): ScheduleSlot[] {
    const newSlots = [...slots]
    
    if (newSlots.length < 2) return newSlots

    const idx1 = Math.floor(Math.random() * newSlots.length)
    let idx2 = Math.floor(Math.random() * newSlots.length)
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * newSlots.length)
    }

    const tempTeacher = newSlots[idx1].teacherId
    newSlots[idx1].teacherId = newSlots[idx2].teacherId
    newSlots[idx2].teacherId = tempTeacher

    const validation = this.validateAll(newSlots, input)
    if (!validation.isValid) {
      newSlots[idx1].teacherId = newSlots[idx2].teacherId
      newSlots[idx2].teacherId = tempTeacher
    }

    return newSlots
  }

  private getTeacherAssignedHours(teacherId: string): number {
    let count = 0
    for (const slot of this.assignedSlots.values()) {
      if (slot.teacherId === teacherId) {
        count++
      }
    }
    return count
  }

  private resetState(): void {
    this.assignedSlots.clear()
    this.teacherDayHours.clear()
    this.classroomDayHours.clear()
    this.teacherConsecutiveHours.clear()
    this.subjectAssignedHours.clear()
  }
}

export async function generateSchedule(
  tenantId: string,
  createdById: string,
  config?: {
    maxConsecutiveHours?: number
    daysPerWeek?: number
    hoursPerDay?: number
  }
): Promise<ScheduleGenerationResult> {
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
        hoursPerWeek: 3,
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
    const greedyResult = await engine.generateGreedy(input)
    const optimizedResult = await engine.optimize(greedyResult.slots, input, {
      iterations: 500,
      temperature: 50,
      coolingRate: 0.99,
    })

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
