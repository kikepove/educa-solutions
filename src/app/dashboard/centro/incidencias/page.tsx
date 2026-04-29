'use client'

import { useState, useEffect, useCallback } from 'react'
import { Ticket, Plus, Search, Filter, AlertTriangle, CheckCircle, Clock, XCircle, Eye } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Table, Column } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { useMutationApi } from '@/hooks/useApi'
import { fetchApi } from '@/lib/api'
import { useApp } from '@/contexts/AppContext'
import type { Incident } from '@/types/frontend'

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

export default function IncidenciasPage() {
  const { addNotification } = useApp()
  const [incidencias, setIncidencias] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [formData, setFormData] = useState({
    title: '', description: '', priority: 'MEDIA', category: 'OTRO', location: '', classroomId: ''
  })

  const { mutate: createIncident } = useMutationApi(
    (data: typeof formData) => fetchApi('/incidencias', { method: 'POST', body: JSON.stringify(data) })
  )

  const { mutate: updateIncident } = useMutationApi(
    (data: { id: string; status: string; solution?: string }) => 
      fetchApi(`/incidencias/${data.id}`, { method: 'PUT', body: JSON.stringify(data) })
  )

  useEffect(() => { loadIncidencias() }, [])

  const loadIncidencias = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filterStatus) params.append('status', filterStatus)
      if (filterPriority) params.append('priority', filterPriority)
      
      const query = params.toString() ? `?${params.toString()}` : ''
      const result = await fetchApi<{ data: Incident[] }>(`/incidencias${query}`)
      setIncidencias(result.data || result)
    } catch (error) {
      console.error('Error:', error)
    } finally { setLoading(false) }
  }

  const handleCreate = async () => {
    try {
      await createIncident(formData)
      setShowModal(false)
      setFormData({ title: '', description: '', priority: 'MEDIA', category: 'OTRO', location: '', classroomId: '' })
      loadIncidencias()
      addNotification({ type: 'success', message: 'Incidencia creada correctamente' })
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message })
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateIncident({ id, status })
      loadIncidencias()
      addNotification({ type: 'success', message: 'Estado actualizado' })
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message })
    }
  }

  const columns: Column<Incident>[] = [
    { key: 'title', header: 'Título', render: (i) => (
      <div>
        <p className="font-medium text-slate-900">{i.title}</p>
        <p className="text-xs text-slate-500 line-clamp-1">{i.description}</p>
      </div>
    )},
    { key: 'priority', header: 'Prioridad', render: (i) => (
      <Badge variant={priorityColors[i.priority]}>{i.priority}</Badge>
    )},
    { key: 'category', header: 'Categoría', render: (i) => categoryLabels[i.category] || i.category },
    { key: 'classroom', header: 'Aula', render: (i) => i.classroom?.name || '-' },
    { key: 'status', header: 'Estado', render: (i) => (
      <Badge variant={statusColors[i.status]}>{i.status.replace('_', ' ')}</Badge>
    )},
    { key: 'createdAt', header: 'Fecha', render: (i) => new Date(i.createdAt).toLocaleDateString('es-ES') },
    { key: 'actions', header: '', className: 'w-10', render: (i) => (
      <button 
        onClick={() => setSelectedIncident(i)}
        className="p-1 hover:bg-slate-100 rounded"
      >
        <Eye className="w-4 h-4 text-slate-400" />
      </button>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Incidencias</h1>
          <p className="text-slate-500 mt-1">Gestiona las incidencias del centro</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Nueva incidencia
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{incidencias.filter(i => i.status === 'ABIERTA').length}</p>
            <p className="text-sm text-slate-500">Abiertas</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{incidencias.filter(i => i.status === 'EN_PROCESO').length}</p>
            <p className="text-sm text-slate-500">En proceso</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{incidencias.filter(i => i.status === 'RESUELTA').length}</p>
            <p className="text-sm text-slate-500">Resueltas</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
            <XCircle className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{incidencias.length}</p>
            <p className="text-sm text-slate-500">Total</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <Input placeholder="Buscar incidencias..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
          </div>
          <Select
            placeholder="Estado"
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: '', label: 'Todos' },
              { value: 'ABIERTA', label: 'Abierta' },
              { value: 'EN_PROCESO', label: 'En proceso' },
              { value: 'RESUELTA', label: 'Resuelta' },
              { value: 'CERRADA', label: 'Cerrada' },
            ]}
          />
          <Select
            placeholder="Prioridad"
            value={filterPriority}
            onChange={setFilterPriority}
            options={[
              { value: '', label: 'Todas' },
              { value: 'BAJA', label: 'Baja' },
              { value: 'MEDIA', label: 'Media' },
              { value: 'ALTA', label: 'Alta' },
              { value: 'CRITICA', label: 'Crítica' },
            ]}
          />
          <Button variant="outline" onClick={loadIncidencias}>
            <Filter className="w-4 h-4" />
            Filtrar
          </Button>
        </div>
        <Table 
          data={incidencias} 
          columns={columns} 
          keyExtractor={(i) => i.id} 
          loading={loading} 
          emptyMessage="No hay incidencias" 
        />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Incidencia" size="lg">
        <div className="space-y-4">
          <Input 
            label="Título" 
            placeholder="Describe brevemente el problema" 
            value={formData.title} 
            onChange={(e) => setFormData({...formData, title: e.target.value})} 
          />
          <div>
            <label className="label">Descripción</label>
            <textarea 
              className="input min-h-[120px]" 
              placeholder="Describe detalladamente el problema..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Prioridad"
              value={formData.priority}
              onChange={(v) => setFormData({...formData, priority: v})}
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
              onChange={(v) => setFormData({...formData, category: v})}
              options={[
                { value: 'HARDWARE', label: 'Hardware' },
                { value: 'SOFTWARE', label: 'Software' },
                { value: 'RED', label: 'Red' },
                { value: 'AULA', label: 'Aula' },
                { value: 'OTRO', label: 'Otro' },
              ]}
            />
          </div>
          <Input 
            label="Ubicación" 
            placeholder="Aula, planta, etc." 
            value={formData.location} 
            onChange={(e) => setFormData({...formData, location: e.target.value})} 
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!formData.title || !formData.description}>Crear incidencia</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!selectedIncident} onClose={() => setSelectedIncident(null)} title="Detalle de Incidencia" size="lg">
        {selectedIncident && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant={priorityColors[selectedIncident.priority]}>{selectedIncident.priority}</Badge>
              <Badge variant={statusColors[selectedIncident.status]}>{selectedIncident.status.replace('_', ' ')}</Badge>
              <Badge variant="info">{categoryLabels[selectedIncident.category]}</Badge>
            </div>
            <h3 className="text-xl font-semibold">{selectedIncident.title}</h3>
            <p className="text-slate-600">{selectedIncident.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-500">Aula</p><p>{selectedIncident.classroom?.name || '-'}</p></div>
              <div><p className="text-slate-500">Ubicación</p><p>{selectedIncident.location || '-'}</p></div>
              <div><p className="text-slate-500">Creada</p><p>{new Date(selectedIncident.createdAt).toLocaleString('es-ES')}</p></div>
              <div><p className="text-slate-500">Creado por</p><p>{selectedIncident.createdBy?.name || '-'}</p></div>
            </div>
            {selectedIncident.solution && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="font-medium text-green-800">Solución</p>
                <p className="text-green-700">{selectedIncident.solution}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setSelectedIncident(null)}>Cerrar</Button>
              {selectedIncident.status !== 'RESUELTA' && selectedIncident.status !== 'CERRADA' && (
                <Button onClick={() => { handleStatusChange(selectedIncident.id, 'RESUELTA'); setSelectedIncident(null) }}>
                  Marcar como resuelta
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
