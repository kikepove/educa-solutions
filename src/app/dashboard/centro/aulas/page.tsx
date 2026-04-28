'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DoorOpen, Plus, Search, Upload, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Table, Column } from '@/components/ui/Table'
import { Alert } from '@/components/ui/Alert'
import { FileUpload } from '@/components/ui/FileUpload'
import { useMutationApi, useApi } from '@/hooks/useApi'
import { fetchApi } from '@/lib/api'
import { useApp } from '@/contexts/AppContext'

interface Classroom {
  id: string
  name: string
  code: string
  capacity?: number
  floor?: number
  building?: string
  hasProjector: boolean
  hasComputer: boolean
  hasWhiteboard: boolean
  isActive: boolean
}

export default function AulasPage() {
  const { data: session } = useSession()
  const { addNotification } = useApp()
  const [aulas, setAulas] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showCSVModal, setShowCSVModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '', code: '', capacity: '', floor: '', building: '',
    hasProjector: false, hasComputer: false, hasWhiteboard: true
  })

  const { mutate: createAula } = useMutationApi(
    (data: any) => fetchApi('/aulas', { method: 'POST', body: JSON.stringify(data) })
  )

  const { mutate: importCSV } = useMutationApi(
    (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return fetch('/api/v1/csv?type=aulas', {
        method: 'POST',
        body: formData,
      }).then(r => r.json())
    }
  )

  useEffect(() => { loadAulas() }, [])

  const loadAulas = async () => {
    setLoading(true)
    try {
      const data = await fetchApi<Classroom[]>('/aulas')
      setAulas(data)
    } catch (error) {
      console.error('Error:', error)
    } finally { setLoading(false) }
  }

  const handleCreate = async () => {
    try {
      await createAula({
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity as string) : undefined,
        floor: formData.floor ? parseInt(formData.floor as string) : undefined,
      })
      setShowModal(false)
      setFormData({ name: '', code: '', capacity: '', floor: '', building: '', hasProjector: false, hasComputer: false, hasWhiteboard: true })
      loadAulas()
      addNotification({ type: 'success', message: 'Aula creada correctamente' })
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message })
    }
  }

  const handleCSVImport = async (file: File) => {
    try {
      const result = await importCSV(file)
      setShowCSVModal(false)
      loadAulas()
      addNotification({ type: 'success', message: `Importados ${result.success} de ${result.total} registros` })
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message })
    }
  }

  const columns: Column<Classroom>[] = [
    { key: 'name', header: 'Nombre', render: (a) => <span className="font-medium">{a.name}</span> },
    { key: 'code', header: 'Código', render: (a) => <code className="text-xs bg-slate-100 px-2 py-1 rounded">{a.code}</code> },
    { key: 'capacity', header: 'Capacidad', render: (a) => a.capacity || '-' },
    { key: 'floor', header: 'Planta', render: (a) => a.floor || '-' },
    { key: 'features', header: 'Equipamiento', render: (a) => (
      <div className="flex gap-1">
        {a.hasProjector && <Badge variant="info">Proyector</Badge>}
        {a.hasComputer && <Badge variant="info">PC</Badge>}
        {a.hasWhiteboard && <Badge variant="info">Pizarra</Badge>}
      </div>
    )},
    { key: 'status', header: 'Estado', render: (a) => <Badge variant={a.isActive ? 'success' : 'error'}>{a.isActive ? 'Activa' : 'Inactiva'}</Badge> },
  ]

  const filteredAulas = aulas.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.code.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aulas</h1>
          <p className="text-slate-500 mt-1">Gestiona las aulas del centro</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCSVModal(true)}>
            <Upload className="w-4 h-4" />
            Importar CSV
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            Nueva aula
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-sm">
            <Input placeholder="Buscar aulas..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
          </div>
        </div>
        <Table data={filteredAulas} columns={columns} keyExtractor={(a) => a.id} loading={loading} emptyMessage="No hay aulas" />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Aula" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" placeholder="Aula 101" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <Input label="Código" placeholder="A101" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Capacidad" type="number" placeholder="30" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} />
            <Input label="Planta" type="number" placeholder="1" value={formData.floor} onChange={(e) => setFormData({...formData, floor: e.target.value})} />
          </div>
          <Input label="Edificio" placeholder="Edificio principal" value={formData.building} onChange={(e) => setFormData({...formData, building: e.target.value})} />
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={formData.hasProjector} onChange={(e) => setFormData({...formData, hasProjector: e.target.checked})} /> Proyector</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={formData.hasComputer} onChange={(e) => setFormData({...formData, hasComputer: e.target.checked})} /> Ordenador</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={formData.hasWhiteboard} onChange={(e) => setFormData({...formData, hasWhiteboard: e.target.checked})} /> Pizarra</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.code}>Crear aula</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCSVModal} onClose={() => setShowCSVModal(false)} title="Importar Aulas desde CSV" size="md">
        <div className="space-y-4">
          <Alert variant="info">
            El archivo CSV debe tener las columnas: name, code, capacity, floor, building, hasProjector, hasComputer, hasWhiteboard
          </Alert>
          <FileUpload accept=".csv" label="Subir archivo CSV" onFileSelect={handleCSVImport} />
        </div>
      </Modal>
    </div>
  )
}
