'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Search, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Table, Column } from '@/components/ui/Table'
import { fetchApi } from '@/lib/api'
import type { Technician } from '@prisma/client'

interface Tenant {
  id: string
  name: string
}

export default function AdminTecnicosPage() {
  const { data: session } = useSession()
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    dni: '',
    name: '',
    surname: '',
    email: '',
    phone: '',
    tenantId: '',
    specialties: [] as string[],
  })

  useEffect(() => {
    loadTenants()
    loadTechnicians()
  }, [])

  const loadTenants = async () => {
    try {
      const data = await fetchApi<Tenant[]>('/centros')
      setTenants(data)
    } catch (error) {
      console.error('Error loading tenants:', error)
    }
  }

  const loadTechnicians = async () => {
    setLoading(true)
    try {
      const data = await fetchApi<Technician[]>('/tecnicos')
      setTechnicians(data)
    } catch (error) {
      console.error('Error loading technicians:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      await fetchApi<any>('/tecnicos', { method: 'POST', body: JSON.stringify(formData) })
      setShowModal(false)
      resetForm()
      loadTechnicians()
    } catch (error) {
      console.error('Error creating technician:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    setSaving(true)
    try {
      await fetchApi<any>(`/tecnicos/${selectedTech?.id}`, { method: 'PUT', body: JSON.stringify(formData) })
      setShowModal(false)
      setSelectedTech(null)
      resetForm()
      loadTechnicians()
    } catch (error) {
      console.error('Error updating technician:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await fetchApi<any>(`/tecnicos/${selectedTech?.id}`, { method: 'DELETE' })
      setShowDeleteModal(false)
      setSelectedTech(null)
      loadTechnicians()
    } catch (error) {
      console.error('Error deleting technician:', error)
    } finally {
      setDeleting(false)
    }
  }

  const resetForm = () => {
    setFormData({ dni: '', name: '', surname: '', email: '', phone: '', tenantId: '', specialties: [] })
  }

  const openEditModal = (tech: Technician) => {
    setSelectedTech(tech)
    setFormData({
      dni: tech.dni || '',
      name: tech.name || '',
      surname: tech.surname || '',
      email: tech.email || '',
      phone: tech.phone || '',
      tenantId: tech.tenantId || '',
      specialties: tech.specialties || [],
    })
    setShowModal(true)
  }

  const openDeleteConfirm = (tech: Technician) => {
    setSelectedTech(tech)
    setShowDeleteModal(true)
  }

  const columns: Column<Technician>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (t) => <span className="font-medium">{t.name} {t.surname}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (t) => <span className="text-slate-500">{t.email}</span>,
    },
    {
      key: 'tenant',
      header: 'Centro',
      render: (t) => {
        const tenant = tenants.find(ten => ten.id === t.tenantId)
        return <span className="text-slate-500">{tenant?.name || 'N/A'}</span>
      },
    },
    {
      key: 'specialties',
      header: 'Especialidades',
      render: (t) => (
        <div className="flex gap-1 flex-wrap">
          {(t.specialties || []).slice(0, 2).map((s: string, i: number) => (
            <Badge key={i} variant="info">{s}</Badge>
          ))}
          {(t.specialties || []).length > 2 && <Badge variant="neutral">+{t.specialties.length - 2}</Badge>}
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Estado',
      render: (t) => (
        <Badge variant={t.isActive ? 'success' : 'error'}>
          {t.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      render: (t) => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(t)} className="p-1 hover:bg-slate-100 rounded">
            <Pencil className="w-4 h-4 text-slate-400" />
          </button>
          <button onClick={() => openDeleteConfirm(t)} className="p-1 hover:bg-slate-100 rounded">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      ),
    },
  ]

  const filteredTechs = technicians.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.surname?.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Técnicos</h1>
          <p className="text-slate-500 mt-1">Administra los técnicos de los centros</p>
        </div>
        <Button onClick={() => { resetForm(); setSelectedTech(null); setShowModal(true) }}>
          <Plus className="w-4 h-4" />
          Nuevo Técnico
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar técnicos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button variant="outline" onClick={loadTechnicians}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <Table
          data={filteredTechs}
          columns={columns}
          keyExtractor={(t) => t.id}
          loading={loading}
          emptyMessage="No hay técnicos registrados"
        />
      </Card>

      {/* Modal Crear/Editar */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedTech(null); resetForm() }} 
        title={selectedTech ? 'Editar Técnico' : 'Nuevo Técnico'} size="md">
        <div className="space-y-4">
          <Input
            label="DNI"
            placeholder="12345678A"
            value={formData.dni}
            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre"
              placeholder="Juan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Apellidos"
              placeholder="Pérez"
              value={formData.surname}
              onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
            />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="tecnico@centro.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Teléfono"
            placeholder="600 000 000"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Centro</label>
            <select
              value={formData.tenantId}
              onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">Seleccionar centro...</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => { setShowModal(false); resetForm() }}>Cancelar</Button>
            <Button onClick={selectedTech ? handleUpdate : handleCreate} loading={saving}>
              {selectedTech ? 'Actualizar' : 'Crear Técnico'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirmar eliminación" size="sm">
        <div className="space-y-4">
          <p>¿Estás seguro de eliminar al técnico <strong>{selectedTech?.name} {selectedTech?.surname}</strong>?</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
