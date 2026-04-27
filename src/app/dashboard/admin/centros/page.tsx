'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Building2, Plus, Search, MoreVertical, RefreshCw, Trash2, Edit } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Table, Column } from '@/components/ui/Table'
import { useMutationApi } from '@/hooks/useApi'
import { fetchApi } from '@/lib/api'

interface Tenant {
  id: string
  name: string
  slug: string
  code: string
  email?: string
  phone?: string
  isActive: boolean
  subscriptionStatus: string
  _count: { users: number; classrooms: number; teachers: number }
}

export default function CentrosPage() {
  const { data: session } = useSession()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', slug: '', email: '', phone: '' })

  const { mutate: createTenant, loading: creating } = useMutationApi(
    (data: typeof formData) => fetchApi<Tenant>('/centros', { method: 'POST', body: JSON.stringify(data) })
  )

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    setLoading(true)
    try {
      const data = await fetchApi<Tenant[]>('/centros')
      setTenants(data)
    } catch (error) {
      console.error('Error loading tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await createTenant(formData)
      setShowModal(false)
      setFormData({ name: '', slug: '', email: '', phone: '' })
      loadTenants()
    } catch (error) {
      console.error('Error creating tenant:', error)
    }
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
          <Badge variant={t.subscriptionStatus === 'ACTIVA' ? 'success' : 'warning'}>
            {t.subscriptionStatus}
          </Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-10',
      render: () => (
        <button className="p-1 hover:bg-slate-100 rounded">
          <MoreVertical className="w-4 h-4 text-slate-400" />
        </button>
      ),
    },
  ]

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Centros educativos</h1>
          <p className="text-slate-500 mt-1">Gestiona los centros registrados en la plataforma</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Centro" size="md">
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
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!formData.name || !formData.slug}>
              Crear centro
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}