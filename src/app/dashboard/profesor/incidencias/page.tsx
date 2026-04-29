'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Ticket, Plus, Search, Filter, AlertTriangle, CheckCircle, Clock, XCircle, Eye, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Table, Column } from '@/components/ui/Table'
import { fetchApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import type { Incident, Classroom } from '@/types/frontend'

const statusColors: Record<string, 'info' | 'warning' | 'success' | 'neutral'> = {
  ABIERTA: 'info',
  EN_PROCESO: 'warning',
  RESUELTA: 'success',
  CERRADA: 'neutral',
}

const priorityColors: Record<string, 'error' | 'warning' | 'info' | 'neutral'> = {
  CRITICA: 'error',
  ALTA: 'warning',
  MEDIA: 'info',
  BAJA: 'neutral',
}

const categoryLabels: Record<string, string> = {
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  RED: 'Red',
  AULA: 'Aula',
  OTRO: 'Otro',
}

export default function ProfesorIncidenciasPage() {
  const { data: session } = useSession()
  const [incidencias, setIncidencias] = useState<Incident[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIA',
    category: 'OTRO',
    location: '',
    classroomId: '',
  })

  useEffect(() => {
    loadIncidencias()
    loadClassrooms()
  }, [])

  const loadIncidencias = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filterStatus) params.append('status', filterStatus)
      if (filterPriority) params.append('priority', filterPriority)
      
      const query = params.toString() ? `?${params.toString()}` : ''
      const data = await fetchApi<Incident[]>(`/incidencias${query}`)
      setIncidencias(data)
    } catch (error) {
      console.error('Error:', error)
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

  const handleCreate = async () => {
    if (!formData.title || !formData.description) {
      toast.error('El título y la descripción son obligatorios')
      return
    }

    setSaving(true)
    try {
      await fetchApi<any>('/incidencias', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      setShowModal(false)
      resetForm()
      loadIncidencias()
      toast.success('Incidencia creada correctamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al crear incidencia')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedIncident) return
    
    setSaving(true)
    try {
      await fetchApi<any>(`/incidencias/${selectedIncident.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      })
      setShowModal(false)
      setSelectedIncident(null)
      resetForm()
      loadIncidencias()
      toast.success('Incidencia actualizada correctamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar incidencia')
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = (incident: Incident) => {
    setSelectedIncident(incident)
    setFormData({
      title: incident.title || '',
      description: incident.description || '',
      priority: incident.priority || 'MEDIA',
      category: incident.category || 'OTRO',
      location: incident.location || '',
      classroomId: incident.classroomId || '',
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIA',
      category: 'OTRO',
      location: '',
      classroomId: '',
    })
  }

  const columns: Column<Incident>[] = [
    {
      key: 'title',
      header: 'Título',
      render: (i) => (
        <div>
          <p className="font-medium text-slate-900">{i.title}</p>
          <p className="text-xs text-slate-500 line-clamp-1">{i.description}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Prioridad',
      render: (i) => <Badge variant={priorityColors[i.priority]}>{i.priority}</Badge>,
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (i) => categoryLabels[i.category] || i.category,
    },
    {
      key: 'classroom',
      header: 'Aula',
      render: (i) => i.classroom?.name || i.location || '-',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (i) => <Badge variant={statusColors[i.status]}>{i.status.replace('_', ' ')}</Badge>,
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      render: (i) => new Date(i.createdAt).toLocaleDateString('es-ES'),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      render: (i) => (
        <button
          onClick={() => openEditModal(i)}
          className="p-1 hover:bg-slate-100 rounded"
          title="Editar"
        >
          <Pencil className="w-4 h-4 text-slate-400" />
        </button>
      ),
    },
  ]

  const filteredIncidencias = incidencias.filter((i) => {
    const matchesSearch =
      !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !filterStatus || i.status === filterStatus
    const matchesPriority = !filterPriority || i.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const stats = [
    { label: 'Abiertas', value: incidencias.filter((i) => i.status === 'ABIERTA').length, icon: Clock, color: 'bg-blue-500' },
    { label: 'En proceso', value: incidencias.filter((i) => i.status === 'EN_PROCESO').length, icon: AlertTriangle, color: 'bg-yellow-500' },
    { label: 'Resueltas', value: incidencias.filter((i) => i.status === 'RESUELTA').length, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Total', value: incidencias.length, icon: Ticket, color: 'bg-slate-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Incidencias</h1>
          <p className="text-slate-500 mt-1">Consulta y reporta incidencias</p>
        </div>
        <Button onClick={() => { resetForm(); setSelectedIncident(null); setShowModal(true) }}>
          <Plus className="w-4 h-4" />
          Nueva incidencia
        </Button>
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
              placeholder="Buscar incidencias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'ABIERTA', label: 'Abierta' },
              { value: 'EN_PROCESO', label: 'En proceso' },
              { value: 'RESUELTA', label: 'Resuelta' },
              { value: 'CERRADA', label: 'Cerrada' },
            ]}
            className="w-48"
          />
          <Select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            options={[
              { value: '', label: 'Todas las prioridades' },
              { value: 'CRITICA', label: 'Crítica' },
              { value: 'ALTA', label: 'Alta' },
              { value: 'MEDIA', label: 'Media' },
              { value: 'BAJA', label: 'Baja' },
            ]}
            className="w-48"
          />
          <Button variant="outline" onClick={loadIncidencias}>
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        <Table
          data={filteredIncidencias}
          columns={columns}
          keyExtractor={(i) => i.id}
          loading={loading}
          emptyMessage="No has reportado incidencias"
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedIncident(null)
          resetForm()
        }}
        title={selectedIncident ? 'Editar Incidencia' : 'Nueva Incidencia'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Título"
            placeholder="Descripción breve del problema"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={4}
              placeholder="Describe detalladamente la incidencia..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Prioridad"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              options={[
                { value: 'BAJA', label: 'Baja' },
                { value: 'MEDIA', label: 'Media' },
                { value: 'ALTA', label: 'Alta' },
                { value: 'CRITICA', label: 'Crítica' },
              ]}
            />
            <Select
              label="Categoría"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: 'HARDWARE', label: 'Hardware' },
                { value: 'SOFTWARE', label: 'Software' },
                { value: 'RED', label: 'Red' },
                { value: 'AULA', label: 'Aula' },
                { value: 'OTRO', label: 'Otro' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ubicación (opcional)"
              placeholder="Ej: 2ª planta, biblioteca..."
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <Select
              label="Aula (opcional)"
              value={formData.classroomId}
              onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
              options={[
                { value: '', label: 'Ninguna' },
                ...classrooms.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowModal(false)
                setSelectedIncident(null)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={selectedIncident ? handleUpdate : handleCreate} loading={saving}>
              {selectedIncident ? 'Actualizar' : 'Crear Incidencia'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
