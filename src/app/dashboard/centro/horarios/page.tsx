'use client'

import { useState, useEffect } from 'react'
import { Clock, Plus, Search, Filter, Calendar, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Table, Column } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { fetchApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import type { Schedule, Classroom, Teacher, Subject } from '@/types/frontend'

const dayLabels: Record<string, string> = {
  'LUNES': 'Lunes',
  'MARTES': 'Martes',
  'MIERCOLES': 'Miércoles',
  'JUEVES': 'Jueves',
  'VIERNES': 'Viernes',
  'SABADO': 'Sábado',
  'DOMINGO': 'Domingo',
}

export default function CentroHorariosPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDay, setFilterDay] = useState('')
  const [filterClassroom, setFilterClassroom] = useState('')
  const [filterTeacher, setFilterTeacher] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    day: 'LUNES',
    startTime: '',
    endTime: '',
    classroomId: '',
    subjectId: '',
    teacherId: '',
    weekNumber: 1,
    notes: '',
  })

  useEffect(() => {
    loadSchedules()
    loadClassrooms()
    loadTeachers()
    loadSubjects()
  }, [])

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterDay) params.append('day', filterDay)
      if (filterClassroom) params.append('classroomId', filterClassroom)
      if (filterTeacher) params.append('teacherId', filterTeacher)
      
      const query = params.toString() ? `?${params.toString()}` : ''
      const result = await fetchApi<{ data: Schedule[]; total: number }>(`/horarios${query}`)
      setSchedules(result.data || result || [])
    } catch (error) {
      console.error('Error loading schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadClassrooms = async () => {
    try {
      const data = await fetchApi<Classroom[]>('/aulas')
      setClassrooms(data)
    } catch (error) {
      console.error('Error loading classrooms:', error)
    }
  }

  const loadTeachers = async () => {
    try {
      const data = await fetchApi<Teacher[]>('/profesores')
      setTeachers(data)
    } catch (error) {
      console.error('Error loading teachers:', error)
    }
  }

  const loadSubjects = async () => {
    try {
      const data = await fetchApi<Subject[]>('/asignaturas')
      setSubjects(data)
    } catch (error) {
      console.error('Error loading subjects:', error)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const result = await fetchApi<any>('/horarios?generateAdvanced=true', {
        method: 'POST',
        body: JSON.stringify({ config: { maxConsecutiveHours: 3, daysPerWeek: 5, hoursPerDay: 7 } }),
      })
      
      if (result.success) {
        toast.success(`Horario generado: ${result.generatedSlots} franjas creadas`)
      } else {
        toast.success(`Generación completada: ${result.message}`)
      }
      setShowGenerateModal(false)
      loadSchedules()
    } catch (error: any) {
      toast.error(error.message || 'Error al generar horario')
    } finally {
      setGenerating(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.day || !formData.startTime || !formData.endTime || !formData.classroomId || !formData.subjectId || !formData.teacherId) {
      toast.error('Completa todos los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      await fetchApi<any>('/horarios', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      setShowModal(false)
      resetForm()
      loadSchedules()
      toast.success('Horario creado correctamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al crear horario')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      day: 'LUNES',
      startTime: '',
      endTime: '',
      classroomId: '',
      subjectId: '',
      teacherId: '',
      weekNumber: 1,
      notes: '',
    })
    setSelectedSchedule(null)
  }

  const columns: Column<Schedule>[] = [
    {
      key: 'day',
      header: 'Día',
      render: (s) => <Badge variant="info">{dayLabels[s.day] || s.day}</Badge>,
    },
    {
      key: 'time',
      header: 'Horario',
      render: (s) => `${s.startTime} - ${s.endTime}`,
    },
    {
      key: 'classroom',
      header: 'Aula',
      render: (s) => s.classroom?.name || '-',
    },
    {
      key: 'subject',
      header: 'Asignatura',
      render: (s) => s.subject?.name || '-',
    },
    {
      key: 'teacher',
      header: 'Profesor',
      render: (s) => s.teacher ? `${s.teacher.name} ${s.teacher.surname}` : '-',
    },
    {
      key: 'weekNumber',
      header: 'Semana',
      render: (s) => s.weekNumber || 1,
    },
  ]

  const filteredSchedules = schedules.filter((s) => {
    const matchesDay = !filterDay || s.day === filterDay
    const matchesClassroom = !filterClassroom || s.classroomId === filterClassroom
    const matchesTeacher = !filterTeacher || s.teacherId === filterTeacher
    return matchesDay && matchesClassroom && matchesTeacher
  })

  const stats = [
    { label: 'Total', value: schedules.length, icon: Calendar, color: 'bg-slate-500' },
    { label: 'Lunes', value: schedules.filter(s => s.day === 'LUNES').length, icon: Clock, color: 'bg-blue-500' },
    { label: 'Martes', value: schedules.filter(s => s.day === 'MARTES').length, icon: Clock, color: 'bg-green-500' },
    { label: 'Miércoles', value: schedules.filter(s => s.day === 'MIERCOLES').length, icon: Clock, color: 'bg-yellow-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Horarios</h1>
          <p className="text-slate-500 mt-1">Gestiona los horarios del centro</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowGenerateModal(true)}>
            <RefreshCw className="w-4 h-4" />
            Generar Automático
          </Button>
          <Button onClick={() => { resetForm(); setShowModal(true) }}>
            <Plus className="w-4 h-4" />
            Nuevo Horario
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar horarios..."
              icon={<Search className="w-4 h-4" />}
              disabled
            />
          </div>
          <Select
            value={filterDay}
            onChange={(e) => { setFilterDay(e.target.value); setTimeout(loadSchedules, 0) }}
            options={[
              { value: '', label: 'Todos los días' },
              { value: 'LUNES', label: 'Lunes' },
              { value: 'MARTES', label: 'Martes' },
              { value: 'MIERCOLES', label: 'Miércoles' },
              { value: 'JUEVES', label: 'Jueves' },
              { value: 'VIERNES', label: 'Viernes' },
            ]}
            className="w-48"
          />
          <Select
            value={filterClassroom}
            onChange={(e) => { setFilterClassroom(e.target.value); setTimeout(loadSchedules, 0) }}
            options={[
              { value: '', label: 'Todas las aulas' },
              ...classrooms.map(c => ({ value: c.id, label: c.name })),
            ]}
            className="w-48"
          />
          <Select
            value={filterTeacher}
            onChange={(e) => { setFilterTeacher(e.target.value); setTimeout(loadSchedules, 0) }}
            options={[
              { value: '', label: 'Todos los profesores' },
              ...teachers.map(t => ({ value: t.id, label: `${t.name} ${t.surname}` })),
            ]}
            className="w-48"
          />
          <Button variant="outline" onClick={loadSchedules}>
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        <Table
          data={filteredSchedules}
          columns={columns}
          keyExtractor={(s) => s.id}
          loading={loading}
          emptyMessage="No hay horarios configurados"
        />
      </Card>

      {/* Modal Crear Horario */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm() }}
        title="Nuevo Horario"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Día"
              value={formData.day}
              onChange={(e) => setFormData({ ...formData, day: e.target.value })}
              options={[
                { value: 'LUNES', label: 'Lunes' },
                { value: 'MARTES', label: 'Martes' },
                { value: 'MIERCOLES', label: 'Miércoles' },
                { value: 'JUEVES', label: 'Jueves' },
                { value: 'VIERNES', label: 'Viernes' },
              ]}
            />
            <Input
              label="Semana"
              type="number"
              min="1"
              max="52"
              value={formData.weekNumber.toString()}
              onChange={(e) => setFormData({ ...formData, weekNumber: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hora inicio"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
            <Input
              label="Hora fin"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
          <Select
            label="Aula"
            value={formData.classroomId}
            onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
            options={[
              { value: '', label: 'Selecciona un aula' },
              ...classrooms.map(c => ({ value: c.id, label: c.name })),
            ]}
          />
          <Select
            label="Asignatura"
            value={formData.subjectId}
            onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
            options={[
              { value: '', label: 'Selecciona asignatura' },
              ...subjects.map(s => ({ value: s.id, label: s.name })),
            ]}
          />
          <Select
            label="Profesor"
            value={formData.teacherId}
            onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
            options={[
              { value: '', label: 'Selecciona profesor' },
              ...teachers.map(t => ({ value: t.id, label: `${t.name} ${t.surname}` })),
            ]}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notas</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Observaciones..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => { setShowModal(false); resetForm() }}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} loading={saving}>
              Crear Horario
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Generar Automático */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generar Horario Automático"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Generación Inteligente</p>
                <p className="text-sm text-blue-700 mt-1">
                  El sistema generará automáticamente los horarios basándose en las asignaturas, 
                  profesores y aulas disponibles. Se respetarán las restricciones configuradas.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowGenerateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate} loading={generating}>
              <RefreshCw className="w-4 h-4" />
              Generar Horarios
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
