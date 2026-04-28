'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Building2, Plus, Search, Pencil, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Table, Column } from '@/components/ui/Table'
import { fetchApi } from '@/lib/api'
import { toast } from 'react-hot-toast'

interface Tenant {
  id: string
  name: string
  slug: string
  code: string
  email?: string
  phone?: string
  isActive: boolean
  subscriptionStatus: string
  qrUrl?: string
  _count: { users: number; classrooms: number; teachers: number }
}

export default function CentrosPage() {
  const { data: session } = useSession()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showInactive, setShowInactive] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [formData, setFormData] = useState({ name: '', slug: '', email: '', phone: '', password: '' })

  const loadTenants = async () => {
    setLoading(true)
    try {
      const data = await fetchApi<Tenant[]>('/centros?showAll=true')
      setTenants(data)
    } catch (error) {
      console.error('Error loading tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTenants() }, [])

  const handleCreate = async () => {
    setSaving(true)
    try {
      await fetchApi<Tenant>('/centros', { method: 'POST', body: JSON.stringify(formData) })
      setShowModal(false)
      setFormData({ name: '', slug: '', email: '', phone: '', password: '' })
      loadTenants()
      toast.success('Centro creado correctamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al crear centro')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    setSaving(true)
    try {
      await fetchApi<Tenant>(`/centros/${selectedTenant?.id}`, { method: 'PUT', body: JSON.stringify(formData) })
      setShowModal(false)
      setSelectedTenant(null)
      setFormData({ name: '', slug: '', email: '', phone: '', password: '' })
      loadTenants()
      toast.success('Centro actualizado correctamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar centro')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (tenant: Tenant) => {
    setToggling(true)
    try {
      await fetchApi<Tenant>(`/centros/${tenant.id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ isActive: !tenant.isActive }) 
      })
      loadTenants()
      toast.success(tenant.isActive ? 'Centro desactivado' : 'Centro activado')
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar estado')
    } finally {
      setToggling(false)
    }
  }

  const handleToggleSubscription = async (tenant: Tenant) => {
    setToggling(true)
    try {
      const newStatus = tenant.subscriptionStatus === 'ACTIVA' ? 'CANCELADA' : 'ACTIVA'
      await fetchApi<Tenant>(`/centros/${tenant.id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ subscriptionStatus: newStatus }) 
      })
      loadTenants()
      toast.success(newStatus === 'ACTIVA' ? 'Suscripción activada' : 'Suscripción cancelada')
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar suscripción')
    } finally {
      setToggling(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await fetchApi<any>(`/centros/${selectedTenant?.id}`, { method: 'DELETE' })
      setShowDeleteModal(false)
      setSelectedTenant(null)
      loadTenants()
      toast.success('Centro eliminado correctamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar centro')
    } finally {
      setDeleting(false)
    }
  }

  const openEditModal = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setFormData({ name: tenant.name, slug: tenant.slug, email: tenant.email || '', phone: tenant.phone || '', password: '' })
    setShowModal(true)
  }

  const openDeleteConfirm = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setShowDeleteModal(true)
  }

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (t) => <span className="font-medium">{t.name}</span>,
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (t) => <span className="text-slate-500">{t.slug}</span>,
    },
    {
      key: 'code',
      header: 'Código',
      render: (t) => <code className="text-xs bg-slate-100 px-2 py-1 rounded">{t.code}</code>,
    },
    {
      key: 'stats',
      header: 'Stats',
      render: (t) => (
        <div className="flex gap-4 text-xs">
          <span className="text-slate-500">{t._count.users} usuarios</span>
          <span className="text-slate-500">{t._count.classrooms} aulas</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (t) => (
        <div className="flex items-center gap-2">
          <Badge variant={t.isActive ? 'success' : 'error'}>
            {t.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
          <button
            onClick={() => handleToggleActive(t)}
            disabled={toggling}
            className={`p-1 rounded ${t.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
            title={t.isActive ? 'Desactivar' : 'Activar'}
          >
            {t.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
    {
      key: 'subscription',
      header: 'Suscripción',
      render: (t) => (
        <button
          onClick={() => handleToggleSubscription(t)}
          disabled={toggling}
          className={`px-2 py-1 rounded text-xs font-medium ${
            t.subscriptionStatus === 'ACTIVA' 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
          }`}
        >
          {t.subscriptionStatus}
        </button>
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

  const filteredTenants = tenants.filter(t => 
    (showInactive || t.isActive) && (
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Centros educativos</h1>
          <p className="text-slate-500 mt-1">Gestiona los centros registrados en la plataforma</p>
        </div>
        <Button onClick={() => { setSelectedTenant(null); setFormData({ name: '', slug: '', email: '', phone: '', password: '' }); setShowModal(true) }}>
          <Plus className="w-4 h-4" />
          Nuevo centro
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar centros..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            <span className="text-slate-600">Mostrar inactivos</span>
          </label>
          <Button variant="outline" onClick={loadTenants}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <Table
          data={filteredTenants}
          columns={columns}
          keyExtractor={(t) => t.id}
          loading={loading}
          emptyMessage="No hay centros registrados"
        />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedTenant(null); setFormData({ name: '', slug: '', email: '', phone: '', password: '' }) }} title={selectedTenant ? 'Editar Centro' : 'Nuevo Centro'} size="md">
        <div className="space-y-4">
          <Input
            label="Nombre del centro"
            placeholder="Instituto Ejemplo"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Slug (URL)"
            placeholder="instituto-ejemplo"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="contacto@instituto.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Teléfono"
            placeholder="900 000 000"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label={selectedTenant ? 'Nueva Contraseña (dejar en blanco para mantener)' : 'Contraseña'}
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => { setShowModal(false); setSelectedTenant(null); setFormData({ name: '', slug: '', email: '', phone: '', password: '' }) }}>Cancelar</Button>
            <Button onClick={selectedTenant ? handleUpdate : handleCreate} loading={saving} disabled={!formData.name || !formData.slug}>
              {selectedTenant ? 'Actualizar' : 'Crear centro'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirmar eliminación" size="sm">
        <div className="space-y-4">
          <p>¿Estás seguro de eliminar el centro <strong>{selectedTenant?.name}</strong>?</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}