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

interface TechnicianWithTenants extends Technician {
  technicianTenants?: Array<{ tenant: Tenant }>
}

export default function AdminTecnicosPage() {
  const { data: session } = useSession()
  const [technicians, setTechnicians] = useState<TechnicianWithTenants[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTech, setSelectedTech] = useState<TechnicianWithTenants | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    dni: '',
    name: '',
    surname: '',
    email: '',
    phone: '',
    password: '',
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
      const data = await fetchApi<TechnicianWithTenants[]>('/tecnicos')
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
      await fetchApi<any>('/tecnicos', { 
        method: 'POST', 
        body: JSON.stringify({ ...formData, tenantIds: selectedTenantIds })
      })
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
      await fetchApi<any>(`/tecnicos/${selectedTech?.id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ ...formData, tenantIds: selectedTenantIds })
      })
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
    setFormData({ dni: '', name: '', surname: '', email: '', phone: '', password: '', specialties: [] })
    setSelectedTenantIds([])
  }

  const openEditModal = (tech: TechnicianWithTenants) => {
    setSelectedTech(tech)
    setFormData({
      dni: tech.dni || '',
      name: tech.name || '',
      surname: tech.surname || '',
      email: tech.email || '',
      phone: tech.phone || '',
      password: '',
      specialties: tech.specialties || [],
    })
    setSelectedTenantIds(tech.technicianTenants?.map(tt => tt.tenant.id) || [])
    setShowModal(true)
  }

  const openDeleteConfirm = (tech: TechnicianWithTenants) => {
    setSelectedTech(tech)
    setShowDeleteModal(true)
  }

  const toggleTenant = (tenantId: string) => {
    if (selectedTenantIds.includes(tenantId)) {
      setSelectedTenantIds(selectedTenantIds.filter(id => id !== tenantId))
    } else {
      setSelectedTenantIds([...selectedTenantIds, tenantId])
    }
  }

  const columns: Column<TechnicianWithTenants>[] = [
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
      key: 'tenants',
      header: 'Centros',
      render: (t) => (
        <div className="flex flex-wrap gap-1">
          {t.technicianTenants?.map((tt, i) => (
            <Badge key={i} variant="info">{tt.tenant.name}</Badge>
          ))}
        </div>
      ),
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
          <p className="text-slate-500 mt-1">Administra los técnicos y asignación a centros</p>
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
        title={selectedTech ? 'Editar Técnico' : 'Nuevo Técnico'} size="lg">
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
          <Input
            label={selectedTech ? 'Nueva Contraseña (dejar en blanco para mantener)' : 'Contraseña'}
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Centros asignados</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {tenants.map(t => (
                <label key={t.id} className="flex items-center gap-2 p-2 border rounded hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selectedTenantIds.includes(t.id)}
                    onChange={() => toggleTenant(t.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{t.name}</span>
                </label>
              ))}
            </div>
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
