'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Clock, Calendar, CheckCircle, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { fetchApi } from '@/lib/api'
import type { Schedule, Classroom, Subject } from '@/types/frontend'

const dayLabels: Record<string, string> = {
  'LUNES': 'Lunes',
  'MARTES': 'Martes',
  'MERCOLES': 'Miércoles',
  'JUEVES': 'Jueves',
  'VIERNES': 'Viernes',
}

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'
]

export default function ProfesorHorarioPage() {
  const { data: session } = useSession()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState(1)

  const userId = (session?.user as any)?.id

  useEffect(() => {
    if (userId) {
      loadSchedule()
    }
  }, [userId, selectedWeek])

  const loadSchedule = async () => {
    setLoading(true)
    try {
      const data = await fetchApi<Schedule[]>(`/horarios?teacherSchedule=true&weekNumber=${selectedWeek}`)
      setSchedules(data)
    } catch (error) {
      console.error('Error loading schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  // Agrupar horarios por día
  const schedulesByDay = (day: string) => {
    return schedules
      .filter(s => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  // Verificar si hay clase en un slot específico
  const getScheduleAt = (day: string, time: string) => {
    return schedules.find(s => 
      s.day === day && 
      s.startTime <= time && 
      s.endTime > time
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mi Horario</h1>
          <p className="text-slate-500 mt-1">Consulta tu horario semanal</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          >
            <option value={1}>Semana 1</option>
            <option value={2}>Semana 2</option>
          </select>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{schedules.length}</p>
            <p className="text-sm text-slate-500">Total clases</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {new Set(schedules.map(s => s.subject?.name)).size}
            </p>
            <p className="text-sm text-slate-500">Asignaturas</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {new Set(schedules.map(s => s.classroom?.name)).size}
            </p>
            <p className="text-sm text-slate-500">Aulas</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {schedules.filter(s => s.day === 'LUNES' || s.day === 'MARTES').length}
            </p>
            <p className="text-sm text-slate-500">Lun-Mart</p>
          </div>
        </Card>
      </div>

      {/* Vista de horario semanal */}
      <Card title="Horario Semanal">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Encabezado con días */}
            <div className="grid grid-cols-6 gap-2 mb-2">
              <div className="font-medium text-sm text-slate-500 p-2">Hora</div>
              {Object.entries(dayLabels).map(([key, label]) => (
                <div key={key} className="font-medium text-sm text-slate-700 p-2 text-center">
                  {label}
                </div>
              ))}
            </div>

            {/* Filas por hora */}
            {timeSlots.map(time => (
              <div key={time} className="grid grid-cols-6 gap-2 mb-2">
                <div className="text-xs text-slate-500 p-2 font-mono">{time}</div>
                {Object.keys(dayLabels).map(day => {
                  const schedule = getScheduleAt(day, time)
                  return (
                    <div key={`${day}-${time}`} className="min-h-[60px]">
                      {schedule && (
                        <div className="bg-primary-50 border border-primary-200 rounded-lg p-2 h-full hover:bg-primary-100 transition-colors">
                          <p className="text-xs font-medium text-primary-900">{schedule.subject?.name}</p>
                          <p className="text-xs text-primary-700">{schedule.classroom?.name}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Lista detallada por día */}
      <Card title="Detalle por Día">
        <div className="space-y-6">
          {Object.entries(dayLabels).map(([day, label]) => {
            const daySchedules = schedulesByDay(day)
            if (daySchedules.length === 0) return null

            return (
              <div key={day}>
                <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  <Badge variant="info">{label}</Badge>
                  <span className="text-sm text-slate-500">({daySchedules.length} clases)</span>
                </h3>
                <div className="space-y-2">
                  {daySchedules.map(schedule => (
                    <div key={schedule.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{schedule.subject?.name}</p>
                        <p className="text-sm text-slate-600">
                          {schedule.classroom?.name} • {schedule.startTime} - {schedule.endTime}
                        </p>
                      </div>
                      <Badge variant="info">{schedule.subject?.name}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
