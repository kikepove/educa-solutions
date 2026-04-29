'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, Plus, Search, Clock, MapPin, User, CheckCircle, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Table, Column } from '@/components/ui/Table'
import { fetchApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import type { Reservation, Classroom } from '@/types/frontend'

export default function ProfesorReservasPage() {
  const { data: session } = useSession()
  const [reservas, setReservas] = useState<Reservation[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classroomId: '',
    date: '',
    startTime: '',
    endTime: '',
  })

  const userId = (session?.user as any)?.id

  const loadReservas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)
      
      const query = params.toString() ? `?${params.toString()}` : ''
      const result = await fetchApi<{ data: Reservation[]; total: number }>(`/reservas${query}`)
      setReservas(result.data || result || [])
    } catch (error) {
      console.error('Error loading reservas:', error)
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    loadReservas()
    loadClassrooms()
  }, [loadReservas])

  const loadClassrooms = async () => {
    try {
      const data = await fetchApi<Classroom[]>('/aulas')
      setClassrooms(data)
    } catch (error) {
      console.error('Error loading classrooms:', error)
    }
  }

  const handleCreate = async () => {
    if (!formData.title || !formData.classroomId || !formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Completa todos los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`)

      await fetchApi<any>('/reservas', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          classroomId: formData.classroomId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      })
      setShowModal(false)
      resetForm()
      loadReservas()
      toast.success('Reserva creada correctamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al crear reserva')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar esta reserva?')) return

    try {
      await fetchApi<any>(`/reservas/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'CANCELADA' }),
      })
      loadReservas()
      toast.success('Reserva cancelada')
    } catch (error: any) {
      toast.error(error.message || 'Error al cancelar')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      classroomId: '',
      date: '',
      startTime: '',
      endTime: '',
    })
  }

  const columns: Column<Reservation>[] = [
    {
      key: 'date',
      header: 'Fecha/Hora',
      render: (r) => (
        <div>
          <p className="font-medium">{new Date(r.startTime).toLocaleDateString('es-ES')}</p>
          <p className="text-xs text-slate-500">
            {new Date(r.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - 
            {new Date(r.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Título',
      render: (r) => (
        <div>
          <p className="font-medium">{r.title}</p>
          {r.description && <p className="text-xs text-slate-500 line-clamp-1">{r.description}</p>}
        </div>
      ),
    },
    {
      key: 'classroom',
      header: 'Aula',
      render: (r) => r.classroom?.name || '-',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (r) => {
        const colors: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
          'PENDIENTE': 'warning',
          'CONFIRMADA': 'success',
          'CANCELADA': 'error',
          'COMPLETADA': 'neutral',
        }
        return <Badge variant={colors[r.status] || 'neutral'}>{r.status}</Badge>
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (r) => {
        if ((r as any).userId === userId && r.status === 'PENDIENTE') {
          return (
            <button
              onClick={() => handleCancel(r.id)}
              className="p-1 hover:bg-red-50 rounded text-red-500"
              title="Cancelar"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )
        }
        return null
      },
    },
  ]

  const filteredReservas = reservas.filter((r) => {
    const matchesSearch = !search || 
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.classroom?.name?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !filterStatus || r.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Reservas</h1>
          <p className="text-slate-500 mt-1">Gestiona las reservas de aulas</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true) }}>
          <Plus className="w-4 h-4" />
          Nueva Reserva
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar reservas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            value={filterStatus}
            onChange={(value) => setFilterStatus(value)}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'PENDIENTE', label: 'Pendiente' },
              { value: 'CONFIRMADA', label: 'Confirmada' },
              { value: 'CANCELADA', label: 'Cancelada' },
              { value: 'COMPLETADA', label: 'Completada' },
            ]}
            className="w-48"
          />
          <Button variant="outline" onClick={loadReservas}>
            <Clock className="w-4 h-4" />
          </Button>
        </div>

        <Table
          data={filteredReservas}
          columns={columns}
          keyExtractor={(r) => r.id}
          loading={loading}
          emptyMessage="No tienes reservas activas"
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm() }}
        title="Nueva Reserva"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Título"
            placeholder="Ej: Clase de programación"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descripción (opcional)</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Detalles de la reserva..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <Select
            label="Aula"
            value={formData.classroomId}
            onChange={(value) => setFormData({ ...formData, classroomId: value })}
            options={[
              { value: '', label: 'Selecciona un aula' },
              ...classrooms.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <Input
            label="Fecha"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
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

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => { setShowModal(false); resetForm() }}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} loading={saving}>
              Crear Reserva
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
